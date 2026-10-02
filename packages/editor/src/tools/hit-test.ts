import { distanceToSegment, type CreaseId, type FoldPattern, type Vec2 } from '@faltstudio/core';

/** Naechste Faltlinie (ohne Rand) innerhalb von `tolerance` mm um den Punkt. */
export function hitCrease(
  pattern: FoldPattern,
  point: Vec2,
  tolerance: number,
): CreaseId | undefined {
  const scored = pattern.graph.creases
    .filter((crease) => crease.kind !== 'border')
    .map((crease) => {
      const segment = {
        a: pattern.positions.get(crease.a) as Vec2,
        b: pattern.positions.get(crease.b) as Vec2,
      };
      return { id: crease.id, distance: distanceToSegment(segment, point) };
    })
    .filter((entry) => entry.distance <= tolerance)
    .sort((left, right) => left.distance - right.distance);
  return scored[0]?.id;
}

/** Basis-ID einer Linie: `L5.1.2` -> `L5`. Stuecke entstehen beim Schneiden. */
export const lineBase = (id: CreaseId): CreaseId => id.replace(/(\.\d+)+$/, '');

/** Alle Stuecke derselben gezeichneten Linie. */
export function wholeLine(pattern: FoldPattern, id: CreaseId): readonly CreaseId[] {
  const base = lineBase(id);
  return pattern.graph.creases
    .filter((crease) => lineBase(crease.id) === base)
    .map((crease) => crease.id);
}
