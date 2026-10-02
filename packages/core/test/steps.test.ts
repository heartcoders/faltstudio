import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  SHEET_A4,
  collinearCreases,
  createDocument,
  createTimeline,
  faceAt,
  foldSides,
  insertStep,
  moveStep,
  parseTutorial,
  preparePattern,
  previewStep,
  removeFold,
  removeStep,
  setFold,
  stateAt,
  updateStep,
} from '../src/index.js';

const dart = parseTutorial(
  readFileSync(new URL('../../../examples/dart-a4.json', import.meta.url), 'utf8'),
);
const pattern = preparePattern(dart);
const timeline = createTimeline(pattern, dart.steps);

describe('Schritte bearbeiten', () => {
  const blank = createDocument(SHEET_A4, 'x', 'x');

  it('fuegt Schritte mit eindeutiger ID an der gewuenschten Stelle ein', () => {
    const first = insertStep(blank, 0, 'A');
    const second = insertStep(first.document, 0, 'B');
    expect(second.document.steps.map((step) => step.title)).toEqual(['B', 'A']);
    expect(new Set(second.document.steps.map((step) => step.id)).size).toBe(2);
  });

  it('verschiebt, aendert und entfernt Schritte', () => {
    const titles = ['A', 'B', 'C'].reduce(
      (document, title) => insertStep(document, document.steps.length, title).document,
      blank,
    );
    const moved = moveStep(titles, 0, 2);
    expect(moved.steps.map((step) => step.title)).toEqual(['B', 'C', 'A']);
    expect(updateStep(moved, 0, { title: 'B' })).toBe(moved);
    expect(updateStep(moved, 0, { title: 'Neu' }).steps[0]?.title).toBe('Neu');
    expect(removeStep(moved, 1).steps.map((step) => step.title)).toEqual(['B', 'A']);
  });

  it('legt Faltungen an, ersetzt und entfernt sie', () => {
    const { document } = insertStep(blank, 0);
    const fold = { creaseIds: ['B-left'], movingPoint: [10, 10] as const, angle: 180 };
    const once = setFold(document, 0, 0, fold);
    const replaced = setFold(once, 0, 0, { ...fold, angle: 90 });
    expect(replaced.steps[0]?.folds.map((entry) => entry.angle)).toEqual([90]);
    expect(removeFold(replaced, 0, 0).steps[0]?.folds).toEqual([]);
  });
});

describe('Segment-Vorschlag', () => {
  it('findet vor Schritt 4 das gespiegelte Segment in der umgeklappten Ecke', () => {
    const before = timeline.boundaries[3];
    if (!before) throw new Error('Zustand fehlt');
    expect(collinearCreases(pattern, before, 'L5')).toEqual(["L5'"]);
  });

  it('schlaegt im flachen Blatt nichts vor, was nicht auf der Geraden liegt', () => {
    const flat = timeline.boundaries[0];
    if (!flat) throw new Error('Zustand fehlt');
    expect(collinearCreases(pattern, flat, 'L5')).toEqual([]);
  });

  it('findet vor den Fluegeln alle Lagen eines Fluegels', () => {
    const before = timeline.boundaries[6];
    if (!before) throw new Error('Zustand fehlt');
    const wing = collinearCreases(pattern, before, 'W7.w1');
    expect(wing).toEqual(expect.arrayContaining(['W7.w2', 'W7.w3', 'W7.w4']));
  });
});

describe('Seiten einer Faltung', () => {
  it('teilt das Blatt an der Mittelfalte in zwei gleich grosse Seiten', () => {
    const sides = foldSides(pattern, ['L1']);
    expect(sides).toHaveLength(2);
    expect(sides[0]?.area).toBeCloseTo((SHEET_A4.width * SHEET_A4.height) / 2, 6);
  });

  it('liefert Punkte, die im Inneren einer Flaeche der jeweiligen Seite liegen', () => {
    for (const side of foldSides(pattern, ['L5', "L5'"])) {
      const face = faceAt(pattern, side.point);
      expect(face && side.faces.has(face.id)).toBe(true);
    }
  });
});

describe('previewStep', () => {
  it('zeigt einen Schritt mit geaendertem Winkel, ohne die Timeline zu veraendern', () => {
    const step = dart.steps[1];
    if (!step) throw new Error('Schritt fehlt');
    const half = { ...step, folds: step.folds.map((fold) => ({ ...fold, angle: 90 })) };
    const preview = previewStep(timeline, 1, half);
    expect(preview.issues).toEqual([]);
    expect(preview.state).not.toEqual(stateAt(timeline, 1, 1));
    expect(previewStep(timeline, 1, step).state).toEqual(stateAt(timeline, 1, 1));
  });
});
