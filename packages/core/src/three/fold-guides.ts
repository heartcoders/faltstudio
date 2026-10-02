import {
  BufferAttribute,
  BufferGeometry,
  CircleGeometry,
  Group,
  Line,
  LineBasicMaterial,
  LineDashedMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  RingGeometry,
  type Camera,
} from 'three';
import { add3, applyTransform, lift, scale3, type Vec2, type Vec3 } from '../math/index.js';
import { gripAt, type FoldHandle } from '../fold/drag.js';
import type { FoldPattern } from '../fold/pattern.js';
import { liftOf, transformOf, type FoldState } from '../fold/state.js';

export interface GuideColors {
  readonly guide: string;
  readonly ghost: string;
  /**
   * Dunkle Unterlinie unter Achse und Bahn: auf hellem Papier traegt sie, auf
   * dem schwarzen Tisch die helle Linie darueber. Der Ghost liegt immer auf dem
   * Papier und bleibt ohne, sonst saehe er aus wie eine Faltlinie.
   */
  readonly halo: string;
}

export interface GuideVisibility {
  readonly axis: boolean;
  readonly grip: boolean;
  readonly path: boolean;
  readonly ghost: boolean;
}

/** Achse reicht etwas ueber die bewegte Seite hinaus, nicht quer durchs Bild. */
const AXIS_REACH_FACTOR = 1.3;
const AXIS_MIN_REACH_MM = 60;
const PATH_SAMPLES = 48;
const GRIP_RADIUS_MM = 7;
const HALO_ORDER = 9;
const GUIDE_ORDER = 10;

function billboard(mesh: Mesh): void {
  mesh.onBeforeRender = (_renderer, _scene, camera: Camera) =>
    mesh.quaternion.copy(camera.quaternion);
}

/** Durchgehende dunkle Unterlinie; teilt die Geometrie mit der hellen Linie darueber. */
function haloOf(line: Line, color: string): Line {
  const material = new LineBasicMaterial({ color, depthTest: false });
  const halo =
    line instanceof LineSegments
      ? new LineSegments(line.geometry, material)
      : new Line(line.geometry, material);
  halo.renderOrder = HALO_ORDER;
  line.renderOrder = GUIDE_ORDER;
  return halo;
}

function setPoints(geometry: BufferGeometry, points: readonly Vec3[]): void {
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(points.flat()), 3));
  geometry.computeBoundingSphere();
}

/**
 * Lesehilfen des Viewers (S5): Faltachse gestrichelt, Greifpunkt als Ring,
 * Bahn der Ecke gepunktet, Zielzustand der beweglichen Seite als Ghost-Umriss.
 */
export class FoldGuides {
  readonly group = new Group();
  readonly #pattern: FoldPattern;
  readonly #axis: Line;
  readonly #path: Line;
  readonly #ghost: LineSegments;
  readonly #halos: { readonly axis: Line; readonly path: Line };
  readonly #grip = new Group();

  constructor(pattern: FoldPattern, colors: GuideColors) {
    this.#pattern = pattern;
    this.#axis = new Line(
      new BufferGeometry(),
      new LineDashedMaterial({ color: colors.guide, dashSize: 8, gapSize: 5, depthTest: false }),
    );
    this.#path = new Line(
      new BufferGeometry(),
      new LineDashedMaterial({ color: colors.guide, dashSize: 1, gapSize: 3, depthTest: false }),
    );
    this.#ghost = new LineSegments(
      new BufferGeometry(),
      new LineDashedMaterial({
        color: colors.ghost,
        dashSize: 3,
        gapSize: 3,
        transparent: true,
        opacity: 0.9,
        depthTest: false,
      }),
    );
    const ringHalo = new Mesh(
      new RingGeometry(GRIP_RADIUS_MM - 0.8, GRIP_RADIUS_MM + 1.8, 48),
      new MeshBasicMaterial({ color: colors.halo, depthTest: false }),
    );
    const ring = new Mesh(
      new RingGeometry(GRIP_RADIUS_MM, GRIP_RADIUS_MM + 1, 48),
      new MeshBasicMaterial({ color: colors.guide, depthTest: false }),
    );
    ringHalo.renderOrder = HALO_ORDER;
    ring.renderOrder = GUIDE_ORDER;
    const dot = new Mesh(
      new CircleGeometry(1.4, 16),
      new MeshBasicMaterial({ color: colors.guide, depthTest: false }),
    );
    dot.renderOrder = GUIDE_ORDER;
    billboard(ringHalo);
    billboard(ring);
    billboard(dot);
    this.#grip.add(ringHalo, ring, dot);
    this.#halos = {
      axis: haloOf(this.#axis, colors.halo),
      path: haloOf(this.#path, colors.halo),
    };
    this.group.add(
      this.#halos.axis,
      this.#halos.path,
      this.#axis,
      this.#path,
      this.#ghost,
      this.#grip,
    );
    this.group.visible = false;
  }

  show(handle: FoldHandle, target: FoldState, progress: number, visible: GuideVisibility): void {
    this.group.visible = true;
    this.#axis.visible = this.#halos.axis.visible = visible.axis;
    this.#path.visible = this.#halos.path.visible = visible.path;
    this.#ghost.visible = visible.ghost;
    this.#grip.visible = visible.grip;
    this.#writeAxis(handle);
    this.#writePath(handle);
    this.#writeGhost(handle, target);
    this.#grip.position.set(...gripAt(handle, progress));
  }

  hide(): void {
    this.group.visible = false;
  }

  /**
   * Blendet die Hilfen ein oder aus (0..1), z.B. beim Wechsel zum naechsten
   * Schritt, damit Achse und Griff nicht schlagartig erscheinen.
   */
  setOpacity(amount: number): void {
    const opacity = Math.min(1, Math.max(0, amount));
    this.group.traverse((object) => {
      if (!(object instanceof Mesh || object instanceof Line)) return;
      const material = object.material as {
        transparent: boolean;
        opacity: number;
        userData: { base?: number };
      };
      material.userData.base ??= material.opacity;
      material.transparent = true;
      material.opacity = (material.userData.base ?? 1) * opacity;
    });
  }

  dispose(): void {
    this.group.traverse((object) => {
      if (object instanceof Mesh || object instanceof Line) {
        object.geometry.dispose();
        (object.material as { dispose(): void }).dispose();
      }
    });
  }

  #writeAxis(handle: FoldHandle): void {
    const { center, axis, radius } = handle;
    const reach = Math.max(AXIS_MIN_REACH_MM, radius * AXIS_REACH_FACTOR);
    setPoints(this.#axis.geometry, [
      add3(center, scale3(axis.direction, -reach)),
      add3(center, scale3(axis.direction, reach)),
    ]);
    this.#axis.computeLineDistances();
  }

  #writePath(handle: FoldHandle): void {
    const points = Array.from({ length: PATH_SAMPLES + 1 }, (_, index) =>
      gripAt(handle, index / PATH_SAMPLES),
    );
    setPoints(this.#path.geometry, points);
    this.#path.computeLineDistances();
  }

  #writeGhost(handle: FoldHandle, target: FoldState): void {
    const points: Vec3[] = [];
    for (const faceId of handle.moving) {
      const polygon = this.#pattern.faceById.get(faceId)?.polygon ?? [];
      const at = (corner: Vec2): Vec3 =>
        applyTransform(
          transformOf(target, faceId),
          add3(lift(corner[0], corner[1]), [0, 0, liftOf(target, faceId) + 0.1]),
        );
      polygon.forEach((corner, index) =>
        points.push(at(corner), at(polygon[(index + 1) % polygon.length] as Vec2)),
      );
    }
    setPoints(this.#ghost.geometry, points);
    this.#ghost.computeLineDistances();
  }
}
