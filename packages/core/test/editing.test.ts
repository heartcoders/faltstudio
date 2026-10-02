import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  SHEET_A4,
  addLines,
  checkFlatFoldability,
  checkLines,
  createDocument,
  createStore,
  createTimeline,
  detectFaces,
  linesToGraph,
  memoizeLast,
  nextLineId,
  parseTutorial,
  planarize,
  preparePattern,
  removeCreases,
  setCreaseKind,
  sheetBorder,
  snapPoint,
  type SnapTargets,
} from '../src/index.js';
import { SQUARE } from './fixtures/patterns.js';

const ALL_TARGETS: SnapTargets = {
  vertices: true,
  midpoints: true,
  edges: true,
  grid: 0,
  angleStep: 22.5,
};

describe('createStore', () => {
  it('nimmt Aenderungen auf und macht sie rueckgaengig und wieder', () => {
    const store = createStore(1);
    store.set(2);
    store.set((value) => value + 1);
    expect(store.get()).toBe(3);
    expect(store.undo()).toBe(true);
    expect(store.get()).toBe(2);
    expect(store.redo()).toBe(true);
    expect(store.get()).toBe(3);
    expect(store.revision).toBe(2);
  });

  it('verwirft die Redo-Kette bei einer neuen Aenderung', () => {
    const store = createStore('a');
    store.set('b');
    store.undo();
    store.set('c');
    expect(store.canRedo).toBe(false);
  });

  it('zeichnet mit record: false oder ohne Verlauf nichts auf', () => {
    const store = createStore(0);
    store.set(1, { record: false });
    expect(store.canUndo).toBe(false);
    const ui = createStore(0, { historyLimit: 0 });
    ui.set(1);
    expect(ui.canUndo).toBe(false);
  });

  it('benachrichtigt Abonnenten mit neuem und altem Zustand', () => {
    const store = createStore(0);
    const seen: (readonly [number, number])[] = [];
    const stop = store.subscribe((next, previous) => seen.push([next, previous]));
    store.set(5);
    stop();
    store.set(6);
    expect(seen).toEqual([[5, 0]]);
  });

  it('rechnet abgeleitete Daten nur bei neuer Eingabe-Referenz neu', () => {
    let runs = 0;
    const derive = memoizeLast((input: { readonly value: number }) => {
      runs += 1;
      return input.value * 2;
    });
    const input = { value: 2 };
    derive(input);
    derive(input);
    derive({ value: 2 });
    expect(runs).toBe(2);
  });
});

describe('Dokument bearbeiten', () => {
  const blank = createDocument(SQUARE, 'Test', '2026-09-25');

  it('legt ein leeres Blatt mit vier Randlinien an', () => {
    expect(blank.creases.map((crease) => crease.kind)).toEqual([
      'border',
      'border',
      'border',
      'border',
    ]);
  });

  it('schneidet neue Linien mit bestehenden', () => {
    const next = addLines(blank, [
      { id: 'L1', a: [0, 0], b: [100, 100], kind: 'valley' },
      { id: 'L2', a: [100, 0], b: [0, 100], kind: 'mountain' },
    ]);
    expect(detectFaces(next).faces).toHaveLength(4);
  });

  it('schreibt Schritt-Verweise um, wenn eine neue Linie eine alte teilt', () => {
    const withLine = addLines(blank, [{ id: 'M', a: [50, 0], b: [50, 100], kind: 'valley' }]);
    const withStep = {
      ...withLine,
      steps: [
        {
          id: 's1',
          title: 'Mitte',
          text: '',
          folds: [{ creaseIds: ['M'], movingPoint: [75, 25] as const, angle: 180 }],
        },
      ],
    };
    const split = addLines(withStep, [{ id: 'H', a: [0, 50], b: [100, 50], kind: 'flat' }]);
    expect(split.steps[0]?.folds[0]?.creaseIds).toEqual(['M.1', 'M.2']);
    const timeline = createTimeline(preparePattern(split), split.steps);
    expect(timeline.issues).toEqual([]);
  });

  it('fuehrt geteilte Stuecke nach dem Loeschen der teilenden Linie wieder zusammen', () => {
    const both = addLines(blank, [
      { id: 'M', a: [50, 0], b: [50, 100], kind: 'valley' },
      { id: 'H', a: [0, 50], b: [100, 50], kind: 'flat' },
    ]);
    const withStep = {
      ...both,
      steps: [
        {
          id: 's1',
          title: '',
          text: '',
          folds: [{ creaseIds: ['M.1', 'M.2'], movingPoint: [75, 25] as const, angle: 180 }],
        },
      ],
    };
    const removed = removeCreases(withStep, ['H.1', 'H.2']);
    expect(
      removed.creases.filter((crease) => crease.kind !== 'border').map((crease) => crease.id),
    ).toEqual(['M']);
    expect(removed.creases.map((crease) => crease.id)).toEqual(
      expect.arrayContaining(['B-left', 'B-right']),
    );
    expect(removed.steps[0]?.folds[0]?.creaseIds).toEqual(['M']);
  });

  it('laesst Randlinien beim Loeschen stehen', () => {
    expect(removeCreases(blank, ['B-left'])).toBe(blank);
  });

  it('aendert die Faltart nur bei echten Aenderungen', () => {
    const withLine = addLines(blank, [{ id: 'M', a: [50, 0], b: [50, 100], kind: 'valley' }]);
    expect(setCreaseKind(withLine, ['M'], 'valley')).toBe(withLine);
    expect(
      setCreaseKind(withLine, ['M'], 'mountain').creases.find((crease) => crease.id === 'M')?.kind,
    ).toBe('mountain');
  });

  it('vergibt freie Linien-IDs', () => {
    const withLine = addLines(blank, [
      { id: 'L1', a: [50, 0], b: [50, 100], kind: 'valley' },
      { id: 'L2', a: [0, 50], b: [100, 50], kind: 'valley' },
    ]);
    expect(nextLineId(withLine)).toBe('L3');
  });
});

describe('snapPoint', () => {
  const graph = planarize(
    linesToGraph([...sheetBorder(SQUARE), { id: 'D', a: [0, 0], b: [100, 100], kind: 'valley' }]),
  );

  it('rastet bevorzugt auf Ecken ein', () => {
    const result = snapPoint(graph, [1, 1.5], { targets: ALL_TARGETS, tolerance: 3 });
    expect(result.kind).toBe('vertex');
    expect(result.point).toEqual([0, 0]);
  });

  it('rastet auf Mittelpunkte vor Kanten ein', () => {
    const result = snapPoint(graph, [49, 51], { targets: ALL_TARGETS, tolerance: 3 });
    expect(result).toMatchObject({ kind: 'midpoint', creaseId: 'D', point: [50, 50] });
  });

  it('findet vom Startpunkt aus den Schnitt eines 22,5-Grad-Strahls mit einer Kante', () => {
    const angle = (67.5 * Math.PI) / 180;
    const hitX = 50 + (100 * Math.cos(angle)) / Math.sin(angle);
    const result = snapPoint(graph, [hitX + 0.8, 99.2], {
      targets: { ...ALL_TARGETS, midpoints: false },
      tolerance: 2,
      start: [50, 0],
    });
    expect(result.kind).toBe('intersection');
    expect(result.point[0]).toBeCloseTo(hitX, 6);
    expect(result.point[1]).toBeCloseTo(100, 6);
    expect(result.angle).toBeCloseTo(67.5, 6);
  });

  it('bleibt ohne Treffer frei', () => {
    expect(snapPoint(graph, [30, 70], { targets: ALL_TARGETS, tolerance: 1 }).kind).toBe('free');
  });

  it('rastet aufs Raster ein, wenn sonst nichts in Reichweite ist', () => {
    const result = snapPoint(graph, [31, 69], {
      targets: { ...ALL_TARGETS, grid: 5 },
      tolerance: 2,
    });
    expect(result).toMatchObject({ kind: 'grid', point: [30, 70] });
  });
});

describe('Validierung', () => {
  it('akzeptiert eine flach faltbare Wasserbombenbasis', () => {
    const lines = [
      ...sheetBorder(SQUARE),
      { id: 'D1', a: [0, 0], b: [100, 100], kind: 'valley' },
      { id: 'D2', a: [100, 0], b: [0, 100], kind: 'valley' },
      { id: 'M', a: [50, 0], b: [50, 100], kind: 'mountain' },
      { id: 'H', a: [0, 50], b: [100, 50], kind: 'mountain' },
    ] as const;
    const graph = planarize(linesToGraph(lines));
    const center = checkFlatFoldability(graph);
    expect(center.filter((issue) => issue.code === 'kawasaki')).toEqual([]);
    expect(center.filter((issue) => issue.code === 'maekawa')).toHaveLength(1);
  });

  it('meldet Kawasaki und Maekawa an einem schiefen Knoten', () => {
    const graph = planarize(
      linesToGraph([
        ...sheetBorder(SQUARE),
        { id: 'A', a: [0, 0], b: [100, 100], kind: 'valley' },
        { id: 'C', a: [30, 0], b: [70, 100], kind: 'valley' },
      ]),
    );
    const codes = checkFlatFoldability(graph)
      .map((issue) => issue.code)
      .sort();
    expect(codes).toEqual(['kawasaki', 'maekawa']);
  });

  it('meldet lose Enden nicht zusaetzlich als Maekawa- oder Kawasaki-Fehler', () => {
    const document = addLines(createDocument(SQUARE, 'x', 'x'), [
      { id: 'S', a: [50, 0], b: [50, 40], kind: 'valley' },
    ]);
    expect(checkFlatFoldability(preparePattern(document).graph)).toEqual([]);
  });

  it('meldet lose Enden und Linien ausserhalb des Blatts', () => {
    const document = addLines(createDocument(SQUARE, 'x', 'x'), [
      { id: 'S', a: [50, 0], b: [50, 40], kind: 'valley' },
      { id: 'O', a: [90, 50], b: [120, 50], kind: 'valley' },
    ]);
    const pattern = preparePattern(document);
    const codes = checkLines(pattern.graph, document.sheet, pattern.dangling).map(
      (issue) => issue.code,
    );
    expect(codes).toEqual(expect.arrayContaining(['dangling', 'outside']));
  });

  it('meldet im Dart-Beispiel keine Befunde', () => {
    const tutorial = parseTutorial(
      readFileSync(new URL('../../../examples/dart-a4.json', import.meta.url), 'utf8'),
    );
    const pattern = preparePattern(tutorial);
    expect(checkLines(pattern.graph, SHEET_A4, pattern.dangling)).toEqual([]);
    expect(checkFlatFoldability(pattern.graph)).toEqual([]);
  });
});
