import {
  AmbientLight,
  Box3,
  DirectionalLight,
  Group,
  PerspectiveCamera,
  Scene,
  Sphere,
  Vector2,
  WebGLRenderer,
} from 'three';
import type { FoldPattern } from '../fold/pattern.js';
import type { RestPose } from '../fold/pose.js';
import type { FoldState } from '../fold/state.js';
import { FoldedSheet, type SheetColors } from './folded-sheet.js';
import { applyRestPose } from './rest-pose.js';

/** Eine Umdrehung in dieser Zeit: ruhig genug fuer eine Uebersicht. */
const TURN_MS = 14_000;
/** Hoechstens so oft neu zeichnen; eine Uebersicht braucht keine 60 Bilder pro Sekunde. */
const FRAME_MS = 1000 / 30;
const FOV_DEG = 30;
const ELEVATION_DEG = 32;
/** Anteil des Radius, den ein flaches Modell aus dem Blickwinkel in der Hoehe einnimmt. */
const FLAT_HEIGHT_SHARE = 0.7;
/** Ohne Bewegung (prefers-reduced-motion) steht das Modell in dieser Drehung. */
const RESTING_TURN_DEG = -35;
/** Nach dem Loslassen bleibt das Modell so lange stehen, wie man es gedreht hat. */
const RETURN_DELAY_MS = 1200;
/** Dann gleitet es in dieser Zeit zurueck in die laufende Drehung. */
const RETURN_MS = 900;
const MAX_TILT_DEG = 60;

/** Von Hand gedrehte Lage; `releasedAt` ist gesetzt, sobald losgelassen wurde. */
interface Hold {
  readonly turn: number;
  readonly tilt: number;
  readonly releasedAt?: number;
}

interface Entry {
  readonly context: CanvasRenderingContext2D;
  readonly sheet: FoldedSheet;
  readonly pivot: Group;
  readonly tilt: Group;
  readonly radius: number;
  visible: boolean;
  hold: Hold | undefined;
}

export interface TurntableModel {
  readonly pattern: FoldPattern;
  /** Anzuzeigender Zustand, meist der fertig gefaltete Flieger. */
  readonly state: FoldState;
  /** Ruhelage des fertigen Modells; ohne sie liegt es wie gefaltet. */
  readonly pose?: RestPose | undefined;
}

/**
 * Drehende 3D-Vorschauen fuer viele Karten mit einem einzigen WebGL-Kontext:
 * Jedes sichtbare Modell wird reihum gerendert und ins 2D-Canvas seiner Karte
 * kopiert. Ein Kontext pro Karte stiesse bei vielen Modellen an die Grenze des
 * Browsers (etwa 16 Kontexte).
 */
export class Turntable {
  readonly #renderer = new WebGLRenderer({ antialias: true, alpha: true });
  readonly #scene = new Scene();
  readonly #camera = new PerspectiveCamera(FOV_DEG, 1, 1, 10_000);
  readonly #entries = new Map<HTMLCanvasElement, Entry>();
  readonly #colors: SheetColors;
  readonly #still = matchMedia('(prefers-reduced-motion: reduce)');
  #frame = 0;
  #lastDraw = 0;

  constructor(colors: SheetColors) {
    this.#colors = colors;
    this.#renderer.setClearColor(0x000000, 0);
    this.#camera.up.set(0, 0, 1);
    const key = new DirectionalLight(0xffffff, 2);
    key.position.set(-300, -500, 900);
    this.#scene.add(new AmbientLight(0xffffff, 0.75), key);
  }

  /** Neues Modell fuer ein Canvas; ein vorhandenes wird ersetzt. */
  add(canvas: HTMLCanvasElement, model: TurntableModel): void {
    this.remove(canvas);
    const context = canvas.getContext('2d');
    if (!context) return;
    const sheet = new FoldedSheet(model.pattern, this.#colors);
    sheet.update(model.state);
    const posed = new Group();
    posed.add(sheet.group);
    applyRestPose(posed, model.pose, 1);
    const sphere = new Box3().setFromObject(posed).getBoundingSphere(new Sphere());
    const offset = new Group();
    offset.position.copy(sphere.center).multiplyScalar(-1);
    offset.add(posed);
    const pivot = new Group();
    pivot.add(offset);
    const tilt = new Group();
    tilt.add(pivot);
    this.#entries.set(canvas, {
      context,
      sheet,
      pivot,
      tilt,
      radius: sphere.radius,
      visible: false,
      hold: undefined,
    });
  }

  setVisible(canvas: HTMLCanvasElement, visible: boolean): void {
    const entry = this.#entries.get(canvas);
    if (!entry) return;
    entry.visible = visible;
    if (!visible) return;
    this.#draw(entry, canvas, performance.now());
    this.#schedule();
  }

  /**
   * Dreht das Modell eines Canvas von Hand weiter (Ziehen). Die erste Bewegung
   * uebernimmt die aktuelle Drehung, danach steht die Automatik still.
   *
   * @param canvas - Canvas der Karte.
   * @param turnDeg - Drehung um die Hochachse, in Grad.
   * @param tiltDeg - Kippen zur Kamera hin, in Grad.
   */
  drag(canvas: HTMLCanvasElement, turnDeg: number, tiltDeg: number): void {
    const entry = this.#entries.get(canvas);
    if (!entry) return;
    const now = performance.now();
    const start =
      entry.hold && entry.hold.releasedAt === undefined ? entry.hold : this.#pose(entry, now);
    entry.hold = {
      turn: start.turn + turnDeg,
      tilt: Math.max(-MAX_TILT_DEG, Math.min(MAX_TILT_DEG, start.tilt + tiltDeg)),
    };
    this.#draw(entry, canvas, now);
  }

  /** Loslassen: kurz stehen bleiben, dann zurueck in die laufende Drehung. */
  release(canvas: HTMLCanvasElement): void {
    const entry = this.#entries.get(canvas);
    if (!entry?.hold || entry.hold.releasedAt !== undefined) return;
    entry.hold = { ...entry.hold, releasedAt: performance.now() };
    this.#schedule(true);
  }

  remove(canvas: HTMLCanvasElement): void {
    this.#entries.get(canvas)?.sheet.dispose();
    this.#entries.delete(canvas);
  }

  /** Mit `force` auch bei reduzierter Bewegung, damit die Rueckkehr nach dem Ziehen ablaeuft. */
  #schedule(force = false): void {
    const returning = [...this.#entries.values()].some(
      (entry) => entry.hold?.releasedAt !== undefined,
    );
    if (this.#frame || (this.#still.matches && !force && !returning)) return;
    this.#frame = requestAnimationFrame((now) => this.#tick(now));
  }

  #tick(now: number): void {
    this.#frame = 0;
    const visible = [...this.#entries].filter(([, entry]) => entry.visible);
    if (visible.length === 0) return;
    if (now - this.#lastDraw >= FRAME_MS) {
      this.#lastDraw = now;
      for (const [canvas, entry] of visible) this.#draw(entry, canvas, now);
    }
    this.#schedule();
  }

  #draw(entry: Entry, canvas: HTMLCanvasElement, now: number): void {
    const ratio = Math.min(2, globalThis.devicePixelRatio || 1);
    const width = Math.max(1, Math.round(canvas.clientWidth * ratio));
    const height = Math.max(1, Math.round(canvas.clientHeight * ratio));
    if (canvas.width !== width || canvas.height !== height)
      Object.assign(canvas, { width, height });
    const size = this.#renderer.getSize(new Vector2());
    if (size.x !== width || size.y !== height) this.#renderer.setSize(width, height, false);
    this.#aim(entry.radius, width / height);
    const { turn, tilt } = this.#pose(entry, now);
    entry.pivot.rotation.z = (turn * Math.PI) / 180;
    entry.tilt.rotation.x = (tilt * Math.PI) / 180;
    this.#scene.add(entry.tilt);
    this.#renderer.render(this.#scene, this.#camera);
    this.#scene.remove(entry.tilt);
    entry.context.clearRect(0, 0, width, height);
    entry.context.drawImage(this.#renderer.domElement, 0, 0, width, height);
  }

  #autoTurn(now: number): number {
    return this.#still.matches ? RESTING_TURN_DEG : ((now % TURN_MS) / TURN_MS) * 360;
  }

  /**
   * Aktuelle Lage: automatische Drehung, von Hand gehalten, oder auf dem Weg
   * zurueck. Zurueck geht es auf dem kuerzeren Weg in die laufende Drehung.
   */
  #pose(entry: Entry, now: number): { readonly turn: number; readonly tilt: number } {
    const auto = this.#autoTurn(now);
    const hold = entry.hold;
    if (!hold) return { turn: auto, tilt: 0 };
    if (hold.releasedAt === undefined) return hold;
    const ratio = Math.min(1, Math.max(0, (now - hold.releasedAt - RETURN_DELAY_MS) / RETURN_MS));
    if (ratio >= 1) {
      entry.hold = undefined;
      return { turn: auto, tilt: 0 };
    }
    const eased = ratio < 0.5 ? 4 * ratio ** 3 : 1 - (-2 * ratio + 2) ** 3 / 2;
    const gap = ((((auto - hold.turn) % 360) + 540) % 360) - 180;
    return { turn: hold.turn + gap * eased, tilt: hold.tilt * (1 - eased) };
  }

  /**
   * Abstand so, dass das Modell in jeder Drehung in die Breite passt. In der
   * Hoehe braucht ein flacher Flieger aus diesem Blickwinkel nur einen Teil
   * seines Radius, deshalb wird dort knapper gerechnet.
   */
  #aim(radius: number, aspect: number): void {
    const elevation = (ELEVATION_DEG * Math.PI) / 180;
    const halfVertical = (FOV_DEG * Math.PI) / 360;
    const halfHorizontal = Math.atan(Math.tan(halfVertical) * aspect);
    const distance =
      Math.max(
        radius / Math.sin(halfHorizontal),
        (radius * FLAT_HEIGHT_SHARE) / Math.sin(halfVertical),
      ) * 1.04;
    this.#camera.aspect = aspect;
    this.#camera.near = distance / 20;
    this.#camera.far = distance * 4;
    this.#camera.position.set(0, -distance * Math.cos(elevation), distance * Math.sin(elevation));
    this.#camera.lookAt(0, 0, 0);
    this.#camera.updateProjectionMatrix();
  }
}
