import {
  applyFold,
  type Fold,
  type FoldPattern,
  type FoldState,
  type LineInput,
  type Vec2,
} from '@faltstudio/core';

/** Faltlinien des Musters als Zeichen-Linien, ohne Rand (den zeichnet die Flaeche selbst). */
export function patternLines(pattern: FoldPattern): readonly LineInput[] {
  return pattern.graph.creases
    .filter((crease) => crease.kind !== 'border')
    .map((crease) => ({
      id: crease.id,
      a: pattern.positions.get(crease.a) as Vec2,
      b: pattern.positions.get(crease.b) as Vec2,
      kind: crease.kind,
    }));
}

/**
 * Polygone der Flaechen, die sich bei dieser Faltung tatsaechlich bewegen,
 * inklusive eingeklemmter loser Lagen; fuer die Schraffur.
 */
export function movingPolygons(
  pattern: FoldPattern,
  fold: Fold | undefined,
  before: FoldState | undefined,
): readonly (readonly Vec2[])[] {
  if (!fold || !before || fold.creaseIds.length === 0) return [];
  const applied = applyFold(pattern, before, fold, 0);
  if (!applied.ok) return [];
  return [...applied.value.moving].flatMap((id) => {
    const face = pattern.faceById.get(id);
    return face ? [face.polygon] : [];
  });
}
