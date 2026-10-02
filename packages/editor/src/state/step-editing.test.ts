import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SHEET_A4, createDocument, parseTutorial } from '@faltstudio/core';
import { Editor } from './editor.js';

const dartText = readFileSync(
  new URL('../../../../examples/dart-a4.json', import.meta.url),
  'utf8',
);

function halvesEditor(): Editor {
  const editor = new Editor(createDocument(SHEET_A4, 'Test', '2026-09-25'));
  editor.updateUi({ symmetry: false });
  editor.drawLine([105, 0], [105, 297]);
  return editor;
}

describe('StepEditing', () => {
  it('legt mit dem ersten Segment Schritt und Faltung an, kleinere Seite beweglich', () => {
    const editor = halvesEditor();
    editor.steps.toggleCrease('L1');
    const fold = editor.steps.fold;
    expect(editor.steps.steps).toHaveLength(1);
    expect(fold?.creaseIds).toEqual(['L1']);
    expect(fold?.angle).toBe(180);
    expect(editor.steps.sides).toHaveLength(2);
    expect(editor.steps.issues).toEqual([]);
  });

  it('wechselt die bewegliche Seite', () => {
    const editor = halvesEditor();
    editor.steps.toggleCrease('L1');
    const before = editor.steps.movingSide;
    editor.steps.chooseSide(before === 0 ? 1 : 0);
    expect(editor.steps.movingSide).toBe(before === 0 ? 1 : 0);
  });

  it('zieht den Winkel nur als Vorschau und schreibt ihn erst beim Loslassen', () => {
    const editor = halvesEditor();
    editor.steps.toggleCrease('L1');
    const revision = editor.document.revision;
    editor.steps.dragAngle(90);
    expect(editor.document.revision).toBe(revision);
    expect(editor.steps.preview).toBeDefined();
    editor.steps.setAngle(90);
    expect(editor.steps.fold?.angle).toBe(90);
    expect(editor.ui.get().angleDraft).toBeUndefined();
    expect(editor.document.revision).toBe(revision + 1);
  });

  it('kehrt fuer Berg das Vorzeichen um und behaelt den Betrag', () => {
    const editor = halvesEditor();
    editor.steps.toggleCrease('L1');
    editor.steps.setAngle(120);
    editor.steps.setDirection('mountain');
    expect(editor.steps.fold?.angle).toBe(-120);
    editor.steps.setAngle(90);
    expect(editor.steps.fold?.angle).toBe(-90);
  });

  it('entfernt die Faltung, wenn das letzte Segment abgewaehlt wird', () => {
    const editor = halvesEditor();
    editor.steps.toggleCrease('L1');
    editor.steps.toggleCrease('L1');
    expect(editor.steps.step?.folds).toEqual([]);
  });

  it('schlaegt im Dart vor Schritt 4 das Segment der umgeklappten Ecke vor', () => {
    const editor = new Editor(parseTutorial(dartText));
    editor.steps.select(3);
    const step = editor.steps.step;
    if (!step) throw new Error('Schritt fehlt');
    editor.steps.toggleCrease("L5'");
    expect(editor.steps.fold?.creaseIds).toEqual(['L5']);
    expect(editor.steps.suggestions).toEqual(["L5'"]);
    editor.steps.acceptSuggestions();
    expect(editor.steps.fold?.creaseIds).toEqual(['L5', "L5'"]);
    expect(editor.steps.issues).toEqual([]);
  });

  it('fuegt Schritte hinter dem aktuellen ein und verschiebt sie', () => {
    const editor = new Editor(parseTutorial(dartText));
    editor.steps.select(1);
    editor.steps.add();
    expect(editor.steps.index).toBe(2);
    expect(editor.steps.steps).toHaveLength(9);
    editor.steps.move(2, 0);
    expect(editor.steps.steps[0]?.title).toBe('Neuer Schritt');
    editor.steps.remove();
    expect(editor.steps.steps).toHaveLength(8);
  });
});

describe('StepEditing mit mehreren Faltungen', () => {
  it('legt eine zweite Faltung im selben Schritt an und bearbeitet sie getrennt', () => {
    const editor = new Editor(createDocument(SHEET_A4, 'Test', '2026-09-25'));
    editor.updateUi({ symmetry: false });
    editor.drawLine([105, 0], [105, 297]);
    editor.drawLine([0, 148.5], [210, 148.5]);
    editor.steps.toggleCrease('L1.1');
    editor.steps.addFold();
    editor.steps.toggleCrease('L2.1');
    expect(editor.steps.step?.folds.map((fold) => fold.creaseIds)).toEqual([['L1.1'], ['L2.1']]);
    editor.steps.setAngle(90);
    expect(editor.steps.step?.folds.map((fold) => fold.angle)).toEqual([180, 90]);
    editor.steps.setSequential(true);
    expect(editor.steps.step?.sequential).toBe(true);
    editor.steps.removeCurrentFold();
    expect(editor.steps.step?.folds).toHaveLength(1);
    expect(editor.steps.foldIndex).toBe(0);
  });

  it('meldet und uebernimmt Linienarten aus dem gefalteten Endzustand', () => {
    const editor = new Editor(parseTutorial(dartText));
    editor.select(['L3']);
    editor.setKind('mountain');
    expect(editor.steps.kindMismatches.map((entry) => entry.creaseId)).toEqual(['L3']);
    editor.steps.adoptFinalKinds();
    expect(editor.steps.kindMismatches).toEqual([]);
  });
});

describe('Schritt-Vorschau', () => {
  it('zeigt nach einer Aenderung den Zielzustand (ohne Animation in Node sofort)', () => {
    const editor = halvesEditor();
    editor.steps.toggleCrease('L1');
    expect(editor.ui.get().stepProgress).toBe(1);
    editor.steps.setPreviewProgress(0.5);
    expect(editor.ui.get().stepProgress).toBe(0.5);
    const half = editor.steps.preview;
    editor.steps.setPreviewProgress(1);
    expect(editor.steps.preview).not.toEqual(half);
  });

  it('setzt die Vorschau beim Schrittwechsel auf den Zielzustand zurueck', () => {
    const editor = new Editor(parseTutorial(dartText));
    editor.steps.setPreviewProgress(0.2);
    editor.steps.select(2);
    expect(editor.ui.get().stepProgress).toBe(1);
  });
});
