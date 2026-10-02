import {
  AmbientLight,
  Box3,
  Color,
  DirectionalLight,
  Group,
  Mesh,
  PCFShadowMap,
  PlaneGeometry,
  ShadowMaterial,
  PerspectiveCamera,
  Raycaster,
  Scene,
  Sphere,
  TOUCH,
  Vector2,
  Vector3,
  type Intersection,
  WebGLRenderer,
  type Object3D,
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export const CAMERA_VIEWS = ['iso', 'top', 'side', 'front'] as const;
export type CameraView = (typeof CAMERA_VIEWS)[number];

const VIEW_DIRECTIONS: Readonly<Record<CameraView, readonly [number, number, number]>> = {
  iso: [0.45, -0.55, 0.7],
  top: [0, -0.001, 1],
  side: [1, 0, 0.0001],
  front: [0, -1, 0.0001],
};

export interface SceneColors {
  readonly background: string;
}

const TABLE_SIZE_MM = 600;

/**
 * Ein Finger faltet, zwei Finger drehen (Handover, Viewer mobil). OrbitControls
 * kennt keine Konstante fuer "nichts"; ein unbekannter Wert laesst die Geste liegen.
 */
const NO_TOUCH_ACTION = -1 as unknown as TOUCH;

export interface PointerRay {
  readonly origin: readonly [number, number, number];
  readonly direction: readonly [number, number, number];
}

export interface CameraPose {
  readonly position: readonly [number, number, number];
  readonly target: readonly [number, number, number];
}
/** Kamera bleibt knapp ueber dem Horizont; darunter laege der Tisch vor dem Papier. */
const MAX_POLAR = Math.PI * 0.47;
const GLIDE_MS = 380;
/** Abstand des Tischs (Schattenflaeche) unter dem Blatt; genug, dass der Polygon-Offset des Papiers ihn nie durchscheinen laesst. */
const TABLE_DEPTH_MM = 4;

/**
 * Kapselt three.js-Szene, Kamera, Controls und Render-Loop. Die Lit-Komponente
 * haelt nur eine Instanz davon und reicht Groesse und Inhalt durch.
 */
export class SceneRenderer {
  readonly #renderer: WebGLRenderer;
  readonly #scene = new Scene();
  readonly #camera = new PerspectiveCamera(40, 1, 1, 5000);
  readonly #controls: OrbitControls;
  readonly #key = new DirectionalLight(0xffffff, 2.2);
  #content: Object3D | undefined;
  #glide: { readonly from: Vector3; readonly to: Vector3; readonly start: number } | undefined;
  readonly #ground = new Group();
  #floor = 0;
  #floorTarget = 0;

  constructor(canvas: HTMLCanvasElement, colors: SceneColors) {
    this.#renderer = new WebGLRenderer({ canvas, antialias: true });
    this.#renderer.setPixelRatio(globalThis.devicePixelRatio ?? 1);
    this.#renderer.shadowMap.enabled = true;
    this.#renderer.shadowMap.type = PCFShadowMap;
    this.#scene.background = new Color(colors.background);
    this.#camera.up.set(0, 0, 1);
    this.#camera.position.set(0, -260, 420);
    this.#controls = this.#createControls(canvas);
    this.#addLights();
    this.#renderer.setAnimationLoop(() => this.#tick());
  }

  /**
   * Das Blatt liegt in der xy-Ebene, oben ist +z. OrbitControls nimmt "oben" von
   * der Kamera; ohne `up = z` dreht es um die falsche Achse und kippt.
   */
  #createControls(canvas: HTMLCanvasElement): OrbitControls {
    const controls = new OrbitControls(this.#camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.12;
    controls.rotateSpeed = 0.7;
    controls.zoomToCursor = true;
    controls.maxPolarAngle = MAX_POLAR;
    controls.touches = { ONE: NO_TOUCH_ACTION, TWO: TOUCH.DOLLY_ROTATE };
    return controls;
  }

  /**
   * Hoehe (mm) des tiefsten Papierpunkts. Raster und Schattenboden folgen weich,
   * damit nichts durch den Boden faellt, wenn ein Fluegel nach unten klappt.
   */
  setFloor(z: number): void {
    this.#floorTarget = z;
  }

  /**
   * Verschiebt den Drehpunkt weich in die Mitte des Inhalts, ohne Abstand oder
   * Blickwinkel zu aendern. Nach einer Faltung liegt das Modell woanders; ohne
   * das dreht die Kamera um einen Punkt neben dem Papier.
   */
  recenter(content: Object3D): void {
    const sphere = new Box3().setFromObject(content).getBoundingSphere(new Sphere());
    if (sphere.isEmpty()) return;
    this.#glide = {
      from: this.#controls.target.clone(),
      to: sphere.center.clone(),
      start: performance.now(),
    };
  }

  setContent(content: Object3D): void {
    if (this.#content) this.#scene.remove(this.#content);
    this.#content = content;
    this.#scene.add(content);
  }

  /**
   * Richtet die Kamera auf das Objekt aus: Blickpunkt in die Mitte, Abstand so,
   * dass die umschliessende Kugel ganz ins Bild passt. Blickrichtung bleibt erhalten.
   */
  fit(content: Object3D): void {
    const sphere = new Box3().setFromObject(content).getBoundingSphere(new Sphere());
    if (sphere.isEmpty()) return;
    const direction = this.#camera.position.clone().sub(this.#controls.target).normalize();
    const distance = sphere.radius / Math.sin((this.#camera.fov * Math.PI) / 360);
    this.#glide = undefined;
    this.#controls.target.copy(sphere.center);
    this.#camera.position.copy(sphere.center).addScaledVector(direction, distance * 1.1);
    this.#controls.minDistance = sphere.radius * 0.4;
    this.#controls.maxDistance = distance * 4;
    this.#aimLight(sphere);
    this.#centerGround(sphere.center);
  }

  /**
   * Raster und Schattenboden mittig unter den Inhalt. Nur beim Einpassen, nicht
   * bei jeder Faltung: sonst wandert das Raster mit, waehrend man zusieht.
   */
  #centerGround(center: Vector3): void {
    this.#ground.position.x = center.x;
    this.#ground.position.y = center.y;
  }

  set controlsEnabled(enabled: boolean) {
    this.#controls.enabled = enabled;
  }

  /** Strahl von der Kamera durch einen Bildschirmpunkt, in Weltkoordinaten (mm). */
  pointerRay(clientX: number, clientY: number): PointerRay {
    const raycaster = this.#raycaster(clientX, clientY);
    const { origin, direction } = raycaster.ray;
    return {
      origin: [origin.x, origin.y, origin.z],
      direction: [direction.x, direction.y, direction.z],
    };
  }

  pick(clientX: number, clientY: number, targets: readonly Object3D[]): Intersection | undefined {
    return this.#raycaster(clientX, clientY).intersectObjects([...targets], false)[0];
  }

  /** Bildschirmposition (CSS-Pixel relativ zum Canvas) eines Weltpunkts. */
  project(point: readonly [number, number, number]): { readonly x: number; readonly y: number } {
    const box = this.#renderer.domElement.getBoundingClientRect();
    const projected = new Vector3(...point).project(this.#camera);
    return { x: ((projected.x + 1) / 2) * box.width, y: ((1 - projected.y) / 2) * box.height };
  }

  setPose(pose: CameraPose): void {
    this.#controls.target.set(...pose.target);
    this.#camera.position.set(...pose.position);
  }

  #raycaster(clientX: number, clientY: number): Raycaster {
    const box = this.#renderer.domElement.getBoundingClientRect();
    const pointer = new Vector2(
      ((clientX - box.left) / box.width) * 2 - 1,
      -((clientY - box.top) / box.height) * 2 + 1,
    );
    const raycaster = new Raycaster();
    raycaster.setFromCamera(pointer, this.#camera);
    return raycaster;
  }

  /** Blickrichtung wechseln, Abstand und Blickpunkt bleiben. */
  setView(view: CameraView): void {
    const distance = this.#camera.position.distanceTo(this.#controls.target);
    const [x, y, z] = VIEW_DIRECTIONS[view];
    this.#camera.position
      .set(x, y, z)
      .normalize()
      .multiplyScalar(distance)
      .add(this.#controls.target);
  }

  /** Blickpunkt in Weltkoordinaten (mm), z.B. die Blattmitte. */
  setTarget(x: number, y: number, z: number): void {
    this.#controls.target.set(x, y, z);
    this.#camera.position.set(x, y - 260, z + 420);
  }

  resize(width: number, height: number): void {
    if (width === 0 || height === 0) return;
    this.#renderer.setSize(width, height, false);
    this.#camera.aspect = width / height;
    this.#camera.updateProjectionMatrix();
  }

  dispose(): void {
    this.#renderer.setAnimationLoop(null);
    this.#controls.dispose();
    this.#renderer.dispose();
  }

  #addLights(): void {
    const key = this.#key;
    key.position.set(-200, -300, 600);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.bias = -0.0004;
    key.shadow.radius = 6;
    this.#scene.add(new AmbientLight(0xffffff, 0.6), key, key.target);
    const floor = new Mesh(
      new PlaneGeometry(TABLE_SIZE_MM * 2, TABLE_SIZE_MM * 2),
      new ShadowMaterial({ opacity: 0.45 }),
    );
    floor.position.z = -TABLE_DEPTH_MM + 0.2;
    floor.receiveShadow = true;
    this.#ground.add(floor);
    this.#scene.add(this.#ground);
  }

  /** Licht folgt dem Inhalt, damit der Schatten nicht aus der Schattenkamera faellt. */
  #aimLight(sphere: Sphere): void {
    const { center, radius } = sphere;
    this.#key.target.position.copy(center);
    this.#key.position.set(center.x - radius, center.y - radius * 1.4, center.z + radius * 2.8);
    const camera = this.#key.shadow.camera;
    [camera.left, camera.right, camera.top, camera.bottom] = [
      -radius * 1.6,
      radius * 1.6,
      radius * 1.6,
      -radius * 1.6,
    ];
    camera.near = 1;
    camera.far = radius * 8;
    camera.updateProjectionMatrix();
  }

  #advanceGlide(now: number): void {
    const glide = this.#glide;
    if (!glide) return;
    const ratio = Math.min(1, (now - glide.start) / GLIDE_MS);
    const eased = 1 - (1 - ratio) ** 3;
    const next = glide.from.clone().lerp(glide.to, eased);
    this.#camera.position.add(next.clone().sub(this.#controls.target));
    this.#controls.target.copy(next);
    if (ratio >= 1) this.#glide = undefined;
  }

  #advanceFloor(): void {
    if (Math.abs(this.#floorTarget - this.#floor) < 0.01) return;
    this.#floor += (this.#floorTarget - this.#floor) * 0.18;
    this.#ground.position.z = this.#floor;
  }

  #tick(): void {
    this.#advanceGlide(performance.now());
    this.#advanceFloor();
    this.#controls.update();
    this.#renderer.render(this.#scene, this.#camera);
  }
}
