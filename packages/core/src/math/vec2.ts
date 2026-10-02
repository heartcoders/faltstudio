/**
 * Unveraenderlicher 2D-Vektor in mm. Tupel statt Klasse, damit Werte ohne
 * Kopie in Snapshots, JSON und Tests landen.
 */
export type Vec2 = readonly [number, number];

export const vec2 = (x: number, y: number): Vec2 => [x, y];

export const add = (a: Vec2, b: Vec2): Vec2 => [a[0] + b[0], a[1] + b[1]];

export const sub = (a: Vec2, b: Vec2): Vec2 => [a[0] - b[0], a[1] - b[1]];

export const scale = (a: Vec2, factor: number): Vec2 => [a[0] * factor, a[1] * factor];

export const dot = (a: Vec2, b: Vec2): number => a[0] * b[0] + a[1] * b[1];

/** z-Komponente des Kreuzprodukts: > 0, wenn b links von a liegt. */
export const cross = (a: Vec2, b: Vec2): number => a[0] * b[1] - a[1] * b[0];

export const length = (a: Vec2): number => Math.hypot(a[0], a[1]);

export const distance = (a: Vec2, b: Vec2): number => length(sub(a, b));

export const lerp = (a: Vec2, b: Vec2, t: number): Vec2 => add(a, scale(sub(b, a), t));

/** Winkel von a gegen die positive x-Achse in Radiant, Bereich (-pi, pi]. */
export const angleOf = (a: Vec2): number => Math.atan2(a[1], a[0]);
