import { add3, cross3, normalize3, sub3, type Vec3 } from './vec3.js';

/** Zeilenweise 3x3-Rotationsmatrix. */
export type Mat3 = readonly [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

/**
 * Starre Bewegung p -> r * p + t einer Flaeche, relativ zur flachen Ausgangslage.
 * Unveraenderlich; jede Operation liefert eine neue Transformation.
 */
export interface RigidTransform {
  readonly r: Mat3;
  readonly t: Vec3;
}

export const IDENTITY: RigidTransform = { r: [1, 0, 0, 0, 1, 0, 0, 0, 1], t: [0, 0, 0] };

export function rotate(r: Mat3, v: Vec3): Vec3 {
  return [
    r[0] * v[0] + r[1] * v[1] + r[2] * v[2],
    r[3] * v[0] + r[4] * v[1] + r[5] * v[2],
    r[6] * v[0] + r[7] * v[1] + r[8] * v[2],
  ];
}

function multiply(a: Mat3, b: Mat3): Mat3 {
  const [a0, a1, a2, a3, a4, a5, a6, a7, a8] = a;
  const [b0, b1, b2, b3, b4, b5, b6, b7, b8] = b;
  return [
    a0 * b0 + a1 * b3 + a2 * b6,
    a0 * b1 + a1 * b4 + a2 * b7,
    a0 * b2 + a1 * b5 + a2 * b8,
    a3 * b0 + a4 * b3 + a5 * b6,
    a3 * b1 + a4 * b4 + a5 * b7,
    a3 * b2 + a4 * b5 + a5 * b8,
    a6 * b0 + a7 * b3 + a8 * b6,
    a6 * b1 + a7 * b4 + a8 * b7,
    a6 * b2 + a7 * b5 + a8 * b8,
  ];
}

const transpose = (r: Mat3): Mat3 => [r[0], r[3], r[6], r[1], r[4], r[7], r[2], r[5], r[8]];

export const applyTransform = (transform: RigidTransform, point: Vec3): Vec3 =>
  add3(rotate(transform.r, point), transform.t);

/** `outer` nach `inner`: erst inner, dann outer anwenden. */
export function compose(outer: RigidTransform, inner: RigidTransform): RigidTransform {
  return { r: multiply(outer.r, inner.r), t: add3(rotate(outer.r, inner.t), outer.t) };
}

export function invert(transform: RigidTransform): RigidTransform {
  const r = transpose(transform.r);
  const t = rotate(r, transform.t);
  return { r, t: [-t[0], -t[1], -t[2]] };
}

/** Normale der Vorderseite (lokal +z) im aktuellen Zustand. */
export const frontNormal = (transform: RigidTransform): Vec3 => rotate(transform.r, [0, 0, 1]);

/** Rotation um die Gerade durch `origin` mit Richtung `axis` (Rodrigues), Winkel in Radiant. */
export function rotationAbout(origin: Vec3, axis: Vec3, radians: number): RigidTransform {
  const [x, y, z] = normalize3(axis);
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const k = 1 - cos;
  const r: Mat3 = [
    cos + x * x * k,
    x * y * k - z * sin,
    x * z * k + y * sin,
    y * x * k + z * sin,
    cos + y * y * k,
    y * z * k - x * sin,
    z * x * k - y * sin,
    z * y * k + x * sin,
    cos + z * z * k,
  ];
  return { r, t: sub3(origin, rotate(r, origin)) };
}

/** Bewegungsrichtung eines Punkts bei positiver Rotation um die Achse. */
export const tangentAt = (point: Vec3, origin: Vec3, axis: Vec3): Vec3 =>
  cross3(axis, sub3(point, origin));
