import { applyTransform, invert, sub, type Vec2, type Vec3 } from '../math/index.js';
import type { FaceId } from '../model/index.js';
import { containsPoint, intersectSegments, type Polygon } from '../geometry/index.js';
import type { FoldPattern } from './pattern.js';
import { transformOf, type FoldState } from './state.js';

export interface TracedSegment {
  readonly faceId: FaceId;
  readonly a: Vec2;
  readonly b: Vec2;
}

const REACH_MM = 10_000;
const PLANE_TOLERANCE_MM = 0.5;

function crossings(polygon: Polygon, from: Vec2, to: Vec2): readonly number[] {
  return polygon
    .map((corner, index) =>
      intersectSegments(
        { a: from, b: to },
        { a: corner, b: polygon[(index + 1) % polygon.length] as Vec2 },
      ),
    )
    .flatMap((hit) => (hit ? [hit.t] : []))
    .sort((left, right) => left - right);
}

function clipLine(polygon: Polygon, from: Vec2, to: Vec2): readonly (readonly [Vec2, Vec2])[] {
  const at = (t: number): Vec2 => [
    from[0] + (to[0] - from[0]) * t,
    from[1] + (to[1] - from[1]) * t,
  ];
  const ts = crossings(polygon, from, to);
  return ts.slice(1).flatMap((t, index) => {
    const start = ts[index] as number;
    if (t - start < 1e-9 || !containsPoint(polygon, at((start + t) / 2))) return [];
    return [[at(start), at(t)] as const];
  });
}

/**
 * Bildet eine Gerade im gefalteten Zustand auf alle Flaechen ab, die sie
 * schneidet, und liefert die Stuecke in flachen Koordinaten. Grundlage fuer
 * Faltungen durch mehrere Lagen: jede Lage bekommt ihr eigenes Segment.
 */
export function traceLine(
  pattern: FoldPattern,
  state: FoldState,
  origin: Vec3,
  direction: Vec3,
): readonly TracedSegment[] {
  return pattern.faces.flatMap((face) => {
    const inverse = invert(transformOf(state, face.id));
    const start = applyTransform(inverse, [
      origin[0] - direction[0] * REACH_MM,
      origin[1] - direction[1] * REACH_MM,
      origin[2] - direction[2] * REACH_MM,
    ]);
    const end = applyTransform(inverse, [
      origin[0] + direction[0] * REACH_MM,
      origin[1] + direction[1] * REACH_MM,
      origin[2] + direction[2] * REACH_MM,
    ]);
    if (Math.abs(start[2]) > PLANE_TOLERANCE_MM || Math.abs(end[2]) > PLANE_TOLERANCE_MM) return [];
    const flatStart: Vec2 = [start[0], start[1]];
    const flatEnd: Vec2 = [end[0], end[1]];
    if (sub(flatEnd, flatStart)[0] === 0 && sub(flatEnd, flatStart)[1] === 0) return [];
    return clipLine(face.polygon, flatStart, flatEnd).map(([a, b]) => ({ faceId: face.id, a, b }));
  });
}
