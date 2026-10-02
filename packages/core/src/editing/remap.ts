import type { Vec2 } from '../math/index.js';
import type { Crease, CreaseId, Step } from '../model/index.js';
import { projectOnSegment, type CreaseGraph, type Segment } from '../geometry/index.js';

function segmentsById(graph: CreaseGraph): ReadonlyMap<CreaseId, Segment> {
  const positions = new Map(
    graph.vertices.map((vertex) => [vertex.id, [vertex.x, vertex.y] as Vec2]),
  );
  return new Map(
    graph.creases.flatMap((crease: Crease) => {
      const a = positions.get(crease.a);
      const b = positions.get(crease.b);
      return a && b ? [[crease.id, { a, b }] as const] : [];
    }),
  );
}

const contains = (outer: Segment, inner: Segment): boolean =>
  projectOnSegment(outer, inner.a) !== undefined && projectOnSegment(outer, inner.b) !== undefined;

/**
 * Uebersetzt Crease-IDs von einem Graphen in einen spaeteren: geteilte Linien
 * werden zu ihren Stuecken, zusammengefuehrte Stuecke zur ganzen Linie.
 * Grundlage dafuer, dass Nachbearbeiten von Linien Schritte nicht zerstoert.
 */
export function remapCreaseIds(
  before: CreaseGraph,
  after: CreaseGraph,
  ids: readonly CreaseId[],
): readonly CreaseId[] {
  const old = segmentsById(before);
  const next = segmentsById(after);
  const mapped = ids.flatMap((id) => {
    const segment = old.get(id);
    if (!segment) return [];
    return [...next]
      .filter(([, candidate]) => contains(segment, candidate) || contains(candidate, segment))
      .map(([nextId]) => nextId);
  });
  return [...new Set(mapped)];
}

export function remapSteps(
  before: CreaseGraph,
  after: CreaseGraph,
  steps: readonly Step[],
): readonly Step[] {
  return steps.map((step) => ({
    ...step,
    folds: step.folds.map((fold) => ({
      ...fold,
      creaseIds: remapCreaseIds(before, after, fold.creaseIds),
    })),
  }));
}
