import { distance, lerp, sub, type Vec2 } from '../math/index.js';
import type { CreaseGraph } from './planarize.js';
import { intersectSegments, type Segment } from './segment.js';

export const SNAP_KINDS = [
  'vertex',
  'midpoint',
  'intersection',
  'edge',
  'angle',
  'grid',
  'free',
] as const;
export type SnapKind = (typeof SNAP_KINDS)[number];

export interface SnapTargets {
  readonly vertices: boolean;
  readonly midpoints: boolean;
  readonly edges: boolean;
  /** Rasterweite in mm; 0 = aus. */
  readonly grid: number;
  /** Winkelschritt in Grad relativ zum Startpunkt; 0 = aus. 22,5 deckt Winkelhalbierende der Grundfaltungen ab. */
  readonly angleStep: number;
}

export interface SnapResult {
  readonly point: Vec2;
  readonly kind: SnapKind;
  /** ID der Linie bei Kante oder Mitte, fuer "Snap · Kante L5". */
  readonly creaseId?: string;
  /** Winkel relativ zum Startpunkt in Grad, falls ein Startpunkt gegeben ist. */
  readonly angle?: number;
}

interface Candidate extends SnapResult {
  readonly distance: number;
  readonly priority: number;
}

const PRIORITY: Readonly<Record<SnapKind, number>> = {
  vertex: 0,
  intersection: 1,
  midpoint: 2,
  edge: 3,
  angle: 4,
  grid: 5,
  free: 6,
};

function segments(graph: CreaseGraph): readonly (Segment & { readonly id: string })[] {
  const byId = new Map(graph.vertices.map((vertex) => [vertex.id, [vertex.x, vertex.y] as Vec2]));
  return graph.creases.flatMap((crease) => {
    const a = byId.get(crease.a);
    const b = byId.get(crease.b);
    return a && b ? [{ id: crease.id, a, b }] : [];
  });
}

function closestOnSegment(segment: Segment, point: Vec2): Vec2 {
  const direction = sub(segment.b, segment.a);
  const lengthSquared = direction[0] ** 2 + direction[1] ** 2;
  if (lengthSquared === 0) return segment.a;
  const t =
    ((point[0] - segment.a[0]) * direction[0] + (point[1] - segment.a[1]) * direction[1]) /
    lengthSquared;
  return lerp(segment.a, segment.b, Math.min(1, Math.max(0, t)));
}

const candidate = (point: Vec2, cursor: Vec2, kind: SnapKind, creaseId?: string): Candidate => ({
  point,
  kind,
  distance: distance(point, cursor),
  priority: PRIORITY[kind],
  ...(creaseId ? { creaseId } : {}),
});

function angleRay(
  start: Vec2,
  cursor: Vec2,
  step: number,
  reach: number,
): Segment & { readonly angle: number } {
  const raw = (Math.atan2(cursor[1] - start[1], cursor[0] - start[0]) * 180) / Math.PI;
  const angle = Math.round(raw / step) * step;
  const radians = (angle * Math.PI) / 180;
  return {
    a: start,
    b: [start[0] + Math.cos(radians) * reach, start[1] + Math.sin(radians) * reach],
    angle,
  };
}

function angleCandidates(
  start: Vec2,
  cursor: Vec2,
  step: number,
  lines: readonly (Segment & { id: string })[],
): readonly Candidate[] {
  const ray = angleRay(start, cursor, step, 10_000);
  const onRay = candidate(closestOnSegment(ray, cursor), cursor, 'angle');
  const hits = lines.flatMap((line) => {
    const hit = intersectSegments(ray, line);
    return hit && hit.t > 1e-9 ? [candidate(hit.point, cursor, 'intersection', line.id)] : [];
  });
  return [onRay, ...hits];
}

function gridCandidate(cursor: Vec2, grid: number): Candidate {
  const round = (value: number): number => Math.round(value / grid) * grid;
  return candidate([round(cursor[0]), round(cursor[1])], cursor, 'grid');
}

/**
 * Einrasten fuer die Zeichenflaeche: Ecken, Mittelpunkte, Kanten, Winkel vom
 * Startpunkt und deren Schnitt mit Linien, Raster. Innerhalb von `tolerance`
 * gewinnt die hoehere Prioritaet, sonst der naechste Kandidat.
 */
export function snapPoint(
  graph: CreaseGraph,
  cursor: Vec2,
  options: { readonly targets: SnapTargets; readonly tolerance: number; readonly start?: Vec2 },
): SnapResult {
  const { targets, tolerance, start } = options;
  const lines = segments(graph);
  const candidates: Candidate[] = [
    ...(targets.vertices
      ? graph.vertices.map((vertex) => candidate([vertex.x, vertex.y], cursor, 'vertex'))
      : []),
    ...(targets.midpoints
      ? lines.map((line) => candidate(lerp(line.a, line.b, 0.5), cursor, 'midpoint', line.id))
      : []),
    ...(targets.edges
      ? lines.map((line) => candidate(closestOnSegment(line, cursor), cursor, 'edge', line.id))
      : []),
    ...(start && targets.angleStep > 0
      ? angleCandidates(start, cursor, targets.angleStep, lines)
      : []),
    ...(targets.grid > 0 ? [gridCandidate(cursor, targets.grid)] : []),
  ].filter((entry) => entry.distance <= tolerance);
  const best = candidates.sort(
    (left, right) => left.priority - right.priority || left.distance - right.distance,
  )[0];
  const result: SnapResult = best
    ? { point: best.point, kind: best.kind, ...(best.creaseId ? { creaseId: best.creaseId } : {}) }
    : { point: cursor, kind: 'free' };
  if (!start) return result;
  const angle =
    (Math.atan2(result.point[1] - start[1], result.point[0] - start[0]) * 180) / Math.PI;
  return { ...result, angle };
}
