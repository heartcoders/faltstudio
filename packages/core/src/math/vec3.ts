/** Unveraenderlicher 3D-Vektor in mm. Das flache Blatt liegt in z = 0. */
export type Vec3 = readonly [number, number, number];

export const add3 = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

export const sub3 = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];

export const scale3 = (a: Vec3, factor: number): Vec3 => [
  a[0] * factor,
  a[1] * factor,
  a[2] * factor,
];

export const dot3 = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

export const cross3 = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

export const length3 = (a: Vec3): number => Math.hypot(a[0], a[1], a[2]);

export function normalize3(a: Vec3): Vec3 {
  const size = length3(a);
  if (size === 0) throw new Error('Nullvektor laesst sich nicht normieren.');
  return scale3(a, 1 / size);
}

export const lift = (x: number, y: number): Vec3 => [x, y, 0];

/** Abstand eines Punkts von der Geraden durch `origin` mit Einheitsrichtung `direction`. */
export function distanceToLine(point: Vec3, origin: Vec3, direction: Vec3): number {
  return length3(cross3(sub3(point, origin), direction));
}
