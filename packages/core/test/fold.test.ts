import { describe, expect, it } from 'vitest';
import {
  LAYER_STEP_MM,
  applyFold,
  applyTransform,
  createTimeline,
  dot3,
  faceAt,
  flatState,
  frontNormal,
  linesToGraph,
  preparePattern,
  sheetBorder,
  stateAt,
  traceLine,
  transformOf,
  type FoldPattern,
  type FoldState,
  type Step,
  type Vec2,
  type Vec3,
} from '../src/index.js';
import { SQUARE } from './fixtures/patterns.js';

const halves = preparePattern(
  linesToGraph([...sheetBorder(SQUARE), { id: 'M', a: [50, 0], b: [50, 100], kind: 'valley' }]),
);

const quarters = preparePattern(
  linesToGraph([
    ...sheetBorder(SQUARE),
    { id: 'M', a: [50, 0], b: [50, 100], kind: 'valley' },
    { id: 'H', a: [0, 50], b: [100, 50], kind: 'valley' },
  ]),
);

function where(pattern: FoldPattern, state: FoldState, point: Vec2): Vec3 {
  const face =
    faceAt(pattern, [point[0] * 0.999 + 0.0005, point[1] * 0.999 + 0.0005]) ?? pattern.faces[0];
  return applyTransform(transformOf(state, face?.id ?? ''), [point[0], point[1], 0]);
}

/** Visuelle Hoehe einer Flaeche: Versatz entlang der Weltnormale +z. */
function worldHeight(pattern: FoldPattern, state: FoldState, point: Vec2): number {
  const face = faceAt(pattern, point);
  if (!face) throw new Error('Punkt liegt auf keiner Flaeche.');
  return (
    (state.lifts.get(face.id) ?? 0) * dot3(frontNormal(transformOf(state, face.id)), [0, 0, 1])
  );
}

function fold(
  pattern: FoldPattern,
  state: FoldState,
  creaseIds: readonly string[],
  movingPoint: Vec2,
  angle: number,
  progress = 1,
) {
  const result = applyFold(pattern, state, { creaseIds, movingPoint, angle }, progress);
  if (!result.ok) throw new Error(result.error.message);
  return result.value.state;
}

const expectPoint = (actual: Vec3, expected: Vec3): void => {
  actual.forEach((value, index) => expect(value).toBeCloseTo(expected[index] ?? 0, 6));
};

describe('Quadrat in der Haelfte falten', () => {
  it('bewegt die rechte Haelfte bei einer Talfalte nach vorn (+z)', () => {
    const half = fold(halves, flatState(halves), ['M'], [75, 50], 180, 0.5);
    expectPoint(where(halves, half, [100, 50]), [50, 50, 50]);
  });

  it('legt die Haelfte bei 180 Grad exakt auf die andere', () => {
    const done = fold(halves, flatState(halves), ['M'], [75, 50], 180);
    expectPoint(where(halves, done, [100, 0]), [0, 0, 0]);
    expectPoint(where(halves, done, [100, 100]), [0, 100, 0]);
  });

  it('bewegt die Seite bei einer Bergfalte nach hinten (-z)', () => {
    const half = fold(halves, flatState(halves), ['M'], [75, 50], -180, 0.5);
    expectPoint(where(halves, half, [100, 50]), [50, 50, -50]);
  });

  it('legt die bewegte Seite oben auf, bei Berg darunter', () => {
    const valley = fold(halves, flatState(halves), ['M'], [75, 50], 180);
    expect(worldHeight(halves, valley, [75, 50])).toBeCloseTo(LAYER_STEP_MM);
    const mountain = fold(halves, flatState(halves), ['M'], [75, 50], -180);
    expect(worldHeight(halves, mountain, [75, 50])).toBeCloseTo(-LAYER_STEP_MM);
  });
});

describe('Faltung durch zwei Lagen', () => {
  const folded = fold(quarters, flatState(quarters), ['M.1', 'M.2'], [75, 50.5], 180);
  const twice = fold(quarters, folded, ['H.1', 'H.2'], [25, 75], 180);

  it('nimmt beide Lagen der oberen Haelfte mit', () => {
    expectPoint(where(quarters, twice, [0, 100]), [0, 0, 0]);
    expectPoint(where(quarters, twice, [100, 100]), [0, 0, 0]);
  });

  it('kehrt die Reihenfolge der umgeklappten Lagen um', () => {
    const heights = [
      worldHeight(quarters, twice, [25, 25]),
      worldHeight(quarters, twice, [75, 25]),
      worldHeight(quarters, twice, [75, 75]),
      worldHeight(quarters, twice, [25, 75]),
    ];
    expect(heights.map((value) => Math.round(value / LAYER_STEP_MM))).toEqual([0, 1, 2, 3]);
  });

  it('meldet Segmente, die im aktuellen Zustand nicht auf einer Geraden liegen', () => {
    const result = applyFold(quarters, folded, {
      creaseIds: ['H.1', 'M.2'],
      movingPoint: [25, 75],
      angle: 180,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('not-collinear');
  });
});

describe('Fehlerfaelle', () => {
  const run = (creaseIds: readonly string[], movingPoint: Vec2) =>
    applyFold(halves, flatState(halves), { creaseIds, movingPoint, angle: 180 });

  it.each([
    [['X'], [75, 50], 'unknown-crease'],
    [[], [75, 50], 'no-crease'],
    [['M'], [50, 50], 'point-on-crease'],
    [['M'], [150, 50], 'point-outside'],
    [['B-top.1'], [75, 50], 'no-moving-side'],
  ] as const)('%j bei Punkt %j ergibt %s', (creaseIds, point, code) => {
    const result = run(creaseIds, point);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe(code);
  });
});

describe('Timeline', () => {
  const steps: readonly Step[] = [
    {
      id: 's1',
      title: 'Vorfalten',
      text: '',
      sequential: true,
      folds: [
        { creaseIds: ['M'], movingPoint: [75, 50], angle: 180 },
        { creaseIds: ['M'], movingPoint: [75, 50], angle: -180 },
      ],
    },
    {
      id: 's2',
      title: 'Falten',
      text: '',
      folds: [{ creaseIds: ['M'], movingPoint: [75, 50], angle: 180 }],
    },
  ];
  const timeline = createTimeline(halves, steps);

  it('laeuft ohne Probleme durch', () => {
    expect(timeline.issues).toEqual([]);
  });

  it('faltet beim Vorfalten erst zu und dann wieder auf', () => {
    expectPoint(where(halves, stateAt(timeline, 0, 0.5), [100, 50]), [0, 50, 0]);
    expectPoint(where(halves, stateAt(timeline, 1, 0), [100, 50]), [100, 50, 0]);
    expect(worldHeight(halves, stateAt(timeline, 1, 0), [75, 50])).toBeCloseTo(0);
  });

  it('interpoliert innerhalb eines Schritts und endet im Endzustand', () => {
    expectPoint(where(halves, stateAt(timeline, 1, 0.5), [100, 50]), [50, 50, 50]);
    expect(stateAt(timeline, 1, 1)).toBe(timeline.boundaries[2]);
    expect(stateAt(timeline, 2, 0)).toBe(timeline.boundaries[2]);
  });

  it('liefert bei wiederholter Abfrage dasselbe Ergebnis', () => {
    expect(stateAt(timeline, 1, 0.3)).toEqual(stateAt(timeline, 1, 0.3));
  });
});

describe('traceLine', () => {
  it('bildet eine Linie im gefalteten Zustand auf beide Lagen ab', () => {
    const done = fold(halves, flatState(halves), ['M'], [75, 50], 180);
    const segments = traceLine(halves, done, [25, 0, 0], [0, 1, 0]);
    const xs = segments.map((segment) => Math.round(segment.a[0])).sort((a, b) => a - b);
    expect(xs).toEqual([25, 75]);
    for (const segment of segments) expect(Math.abs(segment.a[1] - segment.b[1])).toBeCloseTo(100);
  });
});
