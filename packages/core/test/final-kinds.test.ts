import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  applyKinds,
  createTimeline,
  flatState,
  foldedKind,
  kindMismatches,
  linesToGraph,
  parseTutorial,
  preparePattern,
  applyFold,
  sheetBorder,
  setCreaseKind,
  faceAt,
  foldSides,
} from '../src/index.js';
import { SQUARE } from './fixtures/patterns.js';

const halves = preparePattern(
  linesToGraph([...sheetBorder(SQUARE), { id: 'M', a: [50, 0], b: [50, 100], kind: 'valley' }]),
);

function folded(angle: number) {
  const result = applyFold(halves, flatState(halves), {
    creaseIds: ['M'],
    movingPoint: [75, 50],
    angle,
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.value.state;
}

describe('foldedKind', () => {
  it('erkennt Tal und Berg bei 90 Grad', () => {
    expect(foldedKind(halves, folded(90), 'M')).toBe('valley');
    expect(foldedKind(halves, folded(-90), 'M')).toBe('mountain');
  });

  it('erkennt Tal und Berg bei 180 Grad ueber die Lagen', () => {
    expect(foldedKind(halves, folded(180), 'M')).toBe('valley');
    expect(foldedKind(halves, folded(-180), 'M')).toBe('mountain');
  });

  it('meldet ungefaltete Creases', () => {
    expect(foldedKind(halves, flatState(halves), 'M')).toBe('unfolded');
  });
});

describe('kindMismatches', () => {
  const dart = parseTutorial(
    readFileSync(new URL('../../../examples/dart-a4.json', import.meta.url), 'utf8'),
  );

  it('faltet im Pfeil-Beispiel jedes Fluegelsegment, auch in losen Lagen', () => {
    const timeline = createTimeline(preparePattern(dart), dart.steps);
    const finished = timeline.boundaries.at(-1);
    if (!finished) throw new Error('Endzustand fehlt');
    const wings = timeline.pattern.graph.creases.filter((crease) => crease.id.startsWith('W'));
    expect(wings.length).toBeGreaterThan(0);
    for (const crease of wings)
      expect(foldedKind(timeline.pattern, finished, crease.id)).not.toBe('unfolded');
  });

  it('nimmt vor dem rechten Fluegel die eingeklemmten Eckenlagen mit', () => {
    const pattern = preparePattern(dart);
    const timeline = createTimeline(pattern, dart.steps);
    const before = timeline.boundaries[6];
    const fold = dart.steps[6]?.folds[0];
    if (!before || !fold) throw new Error('Schritt 7 fehlt');
    const result = applyFold(pattern, before, fold, 0);
    if (!result.ok) throw new Error(result.error.message);
    const seedOnly = foldSides(pattern, fold.creaseIds).find((side) =>
      side.faces.has(faceAt(pattern, fold.movingPoint)?.id ?? ''),
    );
    expect(result.value.moving.size).toBeGreaterThan(seedOnly?.faces.size ?? 0);
  });

  it('findet im Pfeil-Beispiel keine Abweichung', () => {
    expect(kindMismatches(createTimeline(preparePattern(dart), dart.steps))).toEqual([]);
  });

  it('meldet eine falsch gespeicherte Art und uebernimmt die gefaltete', () => {
    const wrong = setCreaseKind(dart, ['L3'], 'mountain');
    const mismatches = kindMismatches(createTimeline(preparePattern(wrong), wrong.steps));
    expect(mismatches).toEqual([{ creaseId: 'L3', stored: 'mountain', folded: 'valley' }]);
    const fixed = applyKinds(wrong, new Map([['L3', 'valley']]));
    expect(fixed.creases.find((crease) => crease.id === 'L3')?.kind).toBe('valley');
  });
});
