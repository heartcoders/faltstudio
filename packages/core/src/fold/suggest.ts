import {
  applyTransform,
  distanceToLine,
  lift,
  normalize3,
  sub3,
  type Vec2,
  type Vec3,
} from '../math/index.js';
import type { CreaseId, FaceId } from '../model/index.js';
import { centroid, type Face } from '../geometry/index.js';
import { AXIS_TOLERANCE_MM } from './axis.js';
import { movingSide } from './moving-side.js';
import type { FoldPattern } from './pattern.js';
import { transformOf, type FoldState } from './state.js';

function endpoints(pattern: FoldPattern, state: FoldState, creaseId: CreaseId): readonly Vec3[] {
  const crease = pattern.creaseById.get(creaseId);
  const [faceId] = pattern.adjacency.facesByCrease.get(creaseId) ?? [];
  if (!crease || !faceId) return [];
  return [crease.a, crease.b].map((vertex) => {
    const [x, y] = pattern.positions.get(vertex) as Vec2;
    return applyTransform(transformOf(state, faceId), lift(x, y));
  });
}

/**
 * Segment-Vorschlag: alle Faltlinien, die im Zustand `state` auf derselben
 * Geraden liegen wie `creaseId`. Eine Faltung durch mehrere Lagen besteht im
 * Muster aus vielen Segmenten; so findet der Editor sie mit einem Klick.
 */
export function collinearCreases(
  pattern: FoldPattern,
  state: FoldState,
  creaseId: CreaseId,
): readonly CreaseId[] {
  const [origin, end] = endpoints(pattern, state, creaseId);
  if (!origin || !end) return [];
  const direction = normalize3(sub3(end, origin));
  return pattern.graph.creases
    .filter((crease) => crease.kind !== 'border' && crease.id !== creaseId)
    .filter((crease) =>
      endpoints(pattern, state, crease.id).every(
        (point) => distanceToLine(point, origin, direction) <= AXIS_TOLERANCE_MM,
      ),
    )
    .map((crease) => crease.id);
}

export interface FoldSide {
  readonly faces: ReadonlySet<FaceId>;
  /** Punkt sicher im Inneren einer Flaeche dieser Seite, geeignet als `movingPoint`. */
  readonly point: Vec2;
  readonly area: number;
}

function interiorPoint(face: Face): Vec2 {
  const largest = [...face.triangles].sort(
    (left, right) => triangleArea(face, right) - triangleArea(face, left),
  )[0];
  if (!largest) return centroid(face.polygon);
  return centroid(largest.map((index) => face.polygon[index] as Vec2));
}

function triangleArea(face: Face, [a, b, c]: readonly [number, number, number]): number {
  const [p, q, r] = [face.polygon[a], face.polygon[b], face.polygon[c]] as [Vec2, Vec2, Vec2];
  return Math.abs((q[0] - p[0]) * (r[1] - p[1]) - (r[0] - p[0]) * (q[1] - p[1])) / 2;
}

function describeSide(pattern: FoldPattern, faces: ReadonlySet<FaceId>): FoldSide {
  const members = [...faces].flatMap((id) => pattern.faceById.get(id) ?? []);
  const anchor = [...members].sort((left, right) => right.area - left.area)[0];
  return {
    faces,
    point: anchor ? interiorPoint(anchor) : [0, 0],
    area: members.reduce((sum, face) => sum + face.area, 0),
  };
}

/**
 * Die Seiten, in die `creaseIds` das Blatt teilen, groesste zuerst. Mehr als
 * zwei Seiten entstehen bei Faltungen durch mehrere Lagen, die nicht verbunden sind.
 */
export function foldSides(
  pattern: FoldPattern,
  creaseIds: readonly CreaseId[],
): readonly FoldSide[] {
  const blocked = new Set(creaseIds);
  const seen = new Set<FaceId>();
  const sides: FoldSide[] = [];
  for (const face of pattern.faces) {
    if (seen.has(face.id)) continue;
    const component = movingSide(pattern, face.id, blocked);
    for (const id of component) seen.add(id);
    sides.push(describeSide(pattern, component));
  }
  return sides.sort((left, right) => right.area - left.area);
}
