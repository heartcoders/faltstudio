import {
  IDENTITY,
  applyTransform,
  compose,
  cross3,
  dot3,
  frontNormal,
  length3,
  normalize3,
  rotate,
  rotationAbout,
  sub3,
  type RigidTransform,
  type Vec3,
} from '../math/index.js';
import type { FaceId } from '../model/index.js';
import type { FoldPattern } from './pattern.js';
import { liftOf, transformOf, type FoldState } from './state.js';

export interface Bounds {
  readonly min: Vec3;
  readonly max: Vec3;
}

function corners(
  pattern: FoldPattern,
  state: FoldState,
  faceId: FaceId,
  pose: RigidTransform,
): readonly Vec3[] {
  const transform = compose(pose, transformOf(state, faceId));
  return (pattern.faceById.get(faceId)?.polygon ?? []).map(([x, y]) =>
    applyTransform(transform, [x, y, liftOf(state, faceId)]),
  );
}

/** Achsparallele Huelle des gefalteten Papiers, optional nach einer Praesentationsdrehung. */
export function foldedBounds(
  pattern: FoldPattern,
  state: FoldState,
  pose: RigidTransform = IDENTITY,
): Bounds {
  const points = pattern.faces.flatMap((face) => corners(pattern, state, face.id, pose));
  const axis = (index: 0 | 1 | 2, pick: (...values: number[]) => number): number =>
    pick(...points.map((point) => point[index]));
  return {
    min: [axis(0, Math.min), axis(1, Math.min), axis(2, Math.min)],
    max: [axis(0, Math.max), axis(1, Math.max), axis(2, Math.max)],
  };
}

type Matrix = [number, number, number, number, number, number, number, number, number];

/** Flaechengewichtete Kovarianz der Normalen: ihr groesster Eigenvektor ist die dominante Flaechenrichtung. */
function normalCovariance(pattern: FoldPattern, state: FoldState): Matrix {
  const sum: Matrix = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  for (const face of pattern.faces) {
    const normal = frontNormal(transformOf(state, face.id));
    for (let row = 0; row < 3; row++) {
      for (let column = 0; column < 3; column++) {
        const index = row * 3 + column;
        sum[index] =
          (sum[index] ?? 0) + face.area * (normal[row] as number) * (normal[column] as number);
      }
    }
  }
  return sum;
}

function dominantAxis(matrix: Matrix): Vec3 {
  let vector: Vec3 = normalize3([0.31, 0.47, 0.83]);
  for (let iteration = 0; iteration < 64; iteration++) vector = normalize3(rotate(matrix, vector));
  return vector;
}

function turnOnto(from: Vec3, to: Vec3, pivot: Vec3): RigidTransform {
  const axis = cross3(from, to);
  const angle = Math.acos(Math.min(1, Math.max(-1, dot3(from, to))));
  if (length3(axis) < 1e-9)
    return angle < 1e-9 ? IDENTITY : rotationAbout(pivot, perpendicular(from), Math.PI);
  return rotationAbout(pivot, axis, angle);
}

function perpendicular(vector: Vec3): Vec3 {
  const helper: Vec3 = Math.abs(vector[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0];
  return normalize3(cross3(vector, helper));
}

function areaCentroid(pattern: FoldPattern, state: FoldState, pose: RigidTransform): Vec3 {
  let total = 0;
  let sum: Vec3 = [0, 0, 0];
  for (const face of pattern.faces) {
    const points = corners(pattern, state, face.id, pose);
    const center = points.reduce<Vec3>(
      (acc, point) => [
        acc[0] + point[0] / points.length,
        acc[1] + point[1] / points.length,
        acc[2] + point[2] / points.length,
      ],
      [0, 0, 0],
    );
    sum = [
      sum[0] + center[0] * face.area,
      sum[1] + center[1] * face.area,
      sum[2] + center[2] * face.area,
    ];
    total += face.area;
  }
  return [sum[0] / total, sum[1] / total, sum[2] / total];
}

/** Hoehe der dominanten Flaechen (Fluegel), gewichtet mit ihrer Flaeche. */
function dominantHeight(pattern: FoldPattern, state: FoldState, pose: RigidTransform): number {
  let total = 0;
  let sum = 0;
  for (const face of pattern.faces) {
    const normal = rotate(pose.r, frontNormal(transformOf(state, face.id)));
    const weight = face.area * normal[2] * normal[2];
    const points = corners(pattern, state, face.id, pose);
    sum += (weight * points.reduce((acc, point) => acc + point[2], 0)) / points.length;
    total += weight;
  }
  return total > 0 ? sum / total : 0;
}

/**
 * Ruhelage fuer das fertige Modell: Die dominante Flaechenrichtung (beim Flieger
 * die Fluegel) wird waagerecht, der Rest haengt darunter wie ein Kiel. Gedreht
 * wird um die Mitte des Modells; Blickrichtung der Nase bleibt erhalten.
 * Rein fuer die Darstellung, die Faltgeometrie bleibt unberuehrt.
 */
export interface RestPose {
  readonly transform: RigidTransform;
  /** Fester Punkt der Drehung; Zwischenlagen einer Animation drehen um ihn. */
  readonly pivot: Vec3;
}

export function restPose(pattern: FoldPattern, state: FoldState): RestPose {
  const bounds = foldedBounds(pattern, state);
  const pivot: Vec3 = [
    (bounds.min[0] + bounds.max[0]) / 2,
    (bounds.min[1] + bounds.max[1]) / 2,
    (bounds.min[2] + bounds.max[2]) / 2,
  ];
  const axis = dominantAxis(normalCovariance(pattern, state));
  const level = turnOnto(
    dot3(axis, [0, 0, 1]) < 0 ? [-axis[0], -axis[1], -axis[2]] : axis,
    [0, 0, 1],
    pivot,
  );
  const keelBelow = areaCentroid(pattern, state, level)[2] <= dominantHeight(pattern, state, level);
  if (keelBelow) return { transform: level, pivot };
  const nose = longestHorizontal(foldedBounds(pattern, state, level));
  return { transform: compose(rotationAbout(pivot, nose, Math.PI), level), pivot };
}

function longestHorizontal(bounds: Bounds): Vec3 {
  const span = sub3(bounds.max, bounds.min);
  return span[0] >= span[1] ? [1, 0, 0] : [0, 1, 0];
}
