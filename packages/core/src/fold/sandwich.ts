import { applyTransform, cross3, dot3, frontNormal, lift, sub3, type Vec3 } from '../math/index.js';
import type { CreaseId, FaceId } from '../model/index.js';
import type { FoldAxis } from './axis.js';
import { movingSide } from './moving-side.js';
import type { FoldPattern } from './pattern.js';
import { liftOf, transformOf, type FoldState } from './state.js';

const PARALLEL = 0.999;
const PLANE_TOLERANCE_MM = 0.5;
const SIDE_TOLERANCE_MM = 0.01;
const OVERLAP_SHRINK_MM = 0.5;

interface Placement {
  readonly corners: readonly Vec3[];
  readonly height: number;
  readonly coplanar: boolean;
}

function place(pattern: FoldPattern, state: FoldState, faceId: FaceId, axis: FoldAxis): Placement {
  const transform = transformOf(state, faceId);
  const corners = (pattern.faceById.get(faceId)?.polygon ?? []).map(([x, y]) =>
    applyTransform(transform, lift(x, y)),
  );
  const facing = dot3(frontNormal(transform), axis.front);
  const coplanar =
    Math.abs(facing) > PARALLEL &&
    corners.every(
      (point) => Math.abs(dot3(sub3(point, axis.origin), axis.front)) < PLANE_TOLERANCE_MM,
    );
  return { corners, height: liftOf(state, faceId) * Math.sign(facing), coplanar };
}

const across = (axis: FoldAxis): Vec3 => cross3(axis.front, axis.direction);

function centerOf(corners: readonly Vec3[]): Vec3 {
  const sum = corners.reduce<Vec3>(
    (total, point) => [total[0] + point[0], total[1] + point[1], total[2] + point[2]],
    [0, 0, 0],
  );
  const count = Math.max(1, corners.length);
  return [sum[0] / count, sum[1] / count, sum[2] / count];
}

function sideOf(point: Vec3, axis: FoldAxis): number {
  return dot3(sub3(point, axis.origin), across(axis));
}

interface Box {
  readonly minU: number;
  readonly maxU: number;
  readonly minV: number;
  readonly maxV: number;
}

function box(corners: readonly Vec3[], axis: FoldAxis): Box {
  const us = corners.map((point) => dot3(sub3(point, axis.origin), axis.direction));
  const vs = corners.map((point) => sideOf(point, axis));
  return {
    minU: Math.min(...us),
    maxU: Math.max(...us),
    minV: Math.min(...vs),
    maxV: Math.max(...vs),
  };
}

const overlaps = (a: Box, b: Box): boolean =>
  a.minU + OVERLAP_SHRINK_MM < b.maxU &&
  b.minU + OVERLAP_SHRINK_MM < a.maxU &&
  a.minV + OVERLAP_SHRINK_MM < b.maxV &&
  b.minV + OVERLAP_SHRINK_MM < a.maxV;

function components(
  pattern: FoldPattern,
  blocked: ReadonlySet<CreaseId>,
  taken: ReadonlySet<FaceId>,
): readonly ReadonlySet<FaceId>[] {
  const seen = new Set<FaceId>(taken);
  const found: ReadonlySet<FaceId>[] = [];
  for (const face of pattern.faces) {
    if (seen.has(face.id)) continue;
    const component = movingSide(pattern, face.id, blocked);
    for (const id of component) seen.add(id);
    found.push(component);
  }
  return found;
}

/**
 * Lose Lagen, die zwischen bewegten Lagen stecken, muessen mit: Sie liegen in
 * der Faltebene auf der beweglichen Seite der Achse, ueberlappen den bewegten
 * Stapel und liegen hoeher als seine unterste und tiefer als seine oberste Lage.
 * Sonst ginge Papier durch Papier. Lagen unter oder ueber dem Stapel bleiben.
 */
export function sandwichedLayers(
  pattern: FoldPattern,
  state: FoldState,
  moving: ReadonlySet<FaceId>,
  axis: FoldAxis,
  blocked: ReadonlySet<CreaseId>,
): ReadonlySet<FaceId> {
  const placedMoving = [...moving]
    .map((id) => place(pattern, state, id, axis))
    .filter((placement) => placement.coplanar);
  if (placedMoving.length === 0) return new Set();
  const heights = placedMoving.map((placement) => placement.height);
  const [low, high] = [Math.min(...heights), Math.max(...heights)];
  const movingSign = Math.sign(sideOf(centerOf(placedMoving[0]?.corners ?? []), axis));
  const boxes = placedMoving.map((placement) => box(placement.corners, axis));
  const extra = new Set<FaceId>();
  for (const component of components(pattern, blocked, moving)) {
    const placed = [...component].map((id) => place(pattern, state, id, axis));
    const onSide = placed.every(
      (placement) =>
        placement.coplanar &&
        placement.corners.every((point) => sideOf(point, axis) * movingSign >= -SIDE_TOLERANCE_MM),
    );
    const between = placed.every((placement) => placement.height > low && placement.height < high);
    const touching = placed.some((placement) =>
      boxes.some((candidate) => overlaps(candidate, box(placement.corners, axis))),
    );
    if (onSide && between && touching) for (const id of component) extra.add(id);
  }
  return extra;
}
