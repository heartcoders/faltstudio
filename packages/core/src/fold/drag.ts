import {
  add3,
  applyTransform,
  cross3,
  dot3,
  lift,
  rotationAbout,
  scale3,
  sub3,
  type Vec3,
} from '../math/index.js';
import type { FaceId, Fold } from '../model/index.js';
import { applyFold } from './apply-fold.js';
import type { FoldAxis } from './axis.js';
import { success, type FoldResult } from './fold-error.js';
import type { FoldPattern } from './pattern.js';
import { transformOf, type FoldState } from './state.js';

/** Alles, was der Viewer zum Ziehen einer Faltung braucht, im Zustand vor dem Schritt. */
export interface FoldHandle {
  readonly axis: FoldAxis;
  readonly moving: ReadonlySet<FaceId>;
  /** Punkt der beweglichen Seite mit dem groessten Abstand zur Achse: dort greift man an. */
  readonly grip: Vec3;
  /** Fusspunkt des Greifpunkts auf der Achse; Mittelpunkt der Kreisbahn. */
  readonly center: Vec3;
  readonly radius: number;
  /** Zielwinkel in Grad mit Vorzeichen (positiv = Tal). */
  readonly target: number;
}

export interface Ray {
  readonly origin: Vec3;
  readonly direction: Vec3;
}

function footOnAxis(point: Vec3, axis: FoldAxis): Vec3 {
  return add3(axis.origin, scale3(axis.direction, dot3(sub3(point, axis.origin), axis.direction)));
}

function farthestCorner(
  pattern: FoldPattern,
  state: FoldState,
  moving: ReadonlySet<FaceId>,
  axis: FoldAxis,
): Vec3 {
  let best: Vec3 = axis.origin;
  let bestDistance = -1;
  for (const faceId of moving) {
    const face = pattern.faceById.get(faceId);
    for (const [x, y] of face?.polygon ?? []) {
      const point = applyTransform(transformOf(state, faceId), lift(x, y));
      const distance = Math.hypot(...sub3(point, footOnAxis(point, axis)));
      if (distance > bestDistance) [best, bestDistance] = [point, distance];
    }
  }
  return best;
}

/** Bereitet eine Faltung zum Ziehen vor. Fehler kommen wie bei `applyFold` zurueck. */
export function foldHandle(
  pattern: FoldPattern,
  before: FoldState,
  fold: Fold,
): FoldResult<FoldHandle> {
  const applied = applyFold(pattern, before, fold, 0);
  if (!applied.ok) return applied;
  const { axis, moving } = applied.value;
  const grip = farthestCorner(pattern, before, moving, axis);
  const center = footOnAxis(grip, axis);
  return success({
    axis,
    moving,
    grip,
    center,
    radius: Math.hypot(...sub3(grip, center)),
    target: fold.angle,
  });
}

const degrees = (radians: number): number => (radians * 180) / Math.PI;

function pointInRotationPlane(handle: FoldHandle, ray: Ray): Vec3 {
  const normal = handle.axis.direction;
  const denominator = dot3(ray.direction, normal);
  if (Math.abs(denominator) > 1e-3) {
    const t = dot3(sub3(handle.grip, ray.origin), normal) / denominator;
    return add3(ray.origin, scale3(ray.direction, t));
  }
  const toCenter = sub3(handle.center, ray.origin);
  return add3(ray.origin, scale3(ray.direction, dot3(toCenter, ray.direction)));
}

/**
 * Winkel des Zeigers um die Faltachse in Grad: Zeigerstrahl mit der Ebene
 * senkrecht zur Achse schneiden, Winkel gegen die Ausgangslage des Greifpunkts.
 * `previous` haelt den Wert stetig ueber +/-180 Grad hinweg.
 */
export function dragAngle(handle: FoldHandle, ray: Ray, previous = 0): number {
  const normal = handle.axis.direction;
  const hit = sub3(pointInRotationPlane(handle, ray), handle.center);
  const inPlane = sub3(hit, scale3(normal, dot3(hit, normal)));
  const start = sub3(handle.grip, handle.center);
  const raw = degrees(Math.atan2(dot3(cross3(start, inPlane), normal), dot3(start, inPlane)));
  const turns = Math.round((previous - raw) / 360);
  return raw + turns * 360;
}

/** Anteil der Faltung (0..1), den ein gezogener Winkel bedeutet. */
export function dragProgress(handle: FoldHandle, angle: number): number {
  if (handle.target === 0) return 0;
  return Math.min(1, Math.max(0, angle / handle.target));
}

/** Position des Greifpunkts bei Fortschritt `progress`; fuer Ring und Bahn der Ecke. */
export function gripAt(handle: FoldHandle, progress: number): Vec3 {
  const rotation = rotationAbout(
    handle.axis.origin,
    handle.axis.direction,
    (handle.target * progress * Math.PI) / 180,
  );
  return applyTransform(rotation, handle.grip);
}
