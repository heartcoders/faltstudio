import { cross, dot, lerp, sub, type Vec2 } from '../math/index.js';
import { MERGE_TOLERANCE_MM } from './tolerance.js';

export interface Segment {
  readonly a: Vec2;
  readonly b: Vec2;
}

/**
 * Parameter t (0..1) der Projektion von p auf ab, sofern p hoechstens
 * `tolerance` von der Strecke entfernt liegt. Auch knapp hinter den Enden,
 * damit zusammengefuehrte Endpunkte nicht verloren gehen. Sonst undefined.
 */
export function projectOnSegment(
  segment: Segment,
  point: Vec2,
  tolerance: number = MERGE_TOLERANCE_MM,
): number | undefined {
  const direction = sub(segment.b, segment.a);
  const lengthSquared = dot(direction, direction);
  if (lengthSquared === 0) return undefined;
  const segmentLength = Math.sqrt(lengthSquared);
  const slack = tolerance / segmentLength;
  const t = dot(sub(point, segment.a), direction) / lengthSquared;
  if (t < -slack || t > 1 + slack) return undefined;
  const offset = Math.abs(cross(direction, sub(point, segment.a))) / segmentLength;
  if (offset > tolerance) return undefined;
  return Math.min(1, Math.max(0, t));
}

/**
 * Schnittpunkt zweier Strecken als Parameterpaar. Parallele und kollineare
 * Strecken liefern undefined; kollineare Ueberlappung und T-Stoesse erkennt
 * `projectOnSegment` ueber die Endpunkte.
 */
export function intersectSegments(
  first: Segment,
  second: Segment,
): { readonly t: number; readonly u: number; readonly point: Vec2 } | undefined {
  const r = sub(first.b, first.a);
  const s = sub(second.b, second.a);
  const denominator = cross(r, s);
  if (Math.abs(denominator) < 1e-12) return undefined;
  const offset = sub(second.a, first.a);
  const t = cross(offset, s) / denominator;
  const u = cross(offset, r) / denominator;
  if (t < 0 || t > 1 || u < 0 || u > 1) return undefined;
  return { t, u, point: lerp(first.a, first.b, t) };
}

/** Kuerzester Abstand eines Punkts zur Strecke. */
export function distanceToSegment(segment: Segment, point: Vec2): number {
  const direction = sub(segment.b, segment.a);
  const lengthSquared = dot(direction, direction);
  const t =
    lengthSquared === 0
      ? 0
      : Math.min(1, Math.max(0, dot(sub(point, segment.a), direction) / lengthSquared));
  const closest = lerp(segment.a, segment.b, t);
  return Math.hypot(point[0] - closest[0], point[1] - closest[1]);
}
