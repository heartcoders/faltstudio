import { describe, expect, it } from 'vitest';
import {
  SHEET_A4,
  applyHomography,
  homographyFromQuads,
  invertHomography,
  photoToSheet,
  quadMetrics,
  type Quad,
} from '../src/index.js';

const photoCorners: Quad = [
  [312, 208],
  [1488, 164],
  [1560, 1902],
  [268, 1950],
];

describe('Homographie', () => {
  it('bildet die vier Griffe exakt auf die Blattecken ab', () => {
    const matrix = photoToSheet(photoCorners, SHEET_A4);
    const expected = [
      [0, 297],
      [210, 297],
      [210, 0],
      [0, 0],
    ];
    photoCorners.forEach((corner, index) => {
      const [x, y] = applyHomography(matrix, corner);
      expect(x).toBeCloseTo(expected[index]?.[0] ?? 0, 6);
      expect(y).toBeCloseTo(expected[index]?.[1] ?? 0, 6);
    });
  });

  it('ist umkehrbar', () => {
    const matrix = photoToSheet(photoCorners, SHEET_A4);
    const back = applyHomography(invertHomography(matrix), applyHomography(matrix, [800, 900]));
    expect(back[0]).toBeCloseTo(800, 6);
    expect(back[1]).toBeCloseTo(900, 6);
  });

  it('erhaelt Geraden: der Mittelpunkt der Diagonalen im Blatt ist ihr Schnittpunkt im Foto', () => {
    const toPhoto = invertHomography(photoToSheet(photoCorners, SHEET_A4));
    const [cx, cy] = applyHomography(toPhoto, [105, 148.5]);
    const onDiagonal = (a: readonly [number, number], b: readonly [number, number]) =>
      Math.abs((b[0] - a[0]) * (cy - a[1]) - (b[1] - a[1]) * (cx - a[0])) /
      Math.hypot(b[0] - a[0], b[1] - a[1]);
    expect(onDiagonal(photoCorners[0], photoCorners[2])).toBeLessThan(1e-6);
    expect(onDiagonal(photoCorners[1], photoCorners[3])).toBeLessThan(1e-6);
  });

  it('lehnt drei Punkte auf einer Geraden ab', () => {
    expect(() =>
      homographyFromQuads(
        [
          [0, 0],
          [1, 0],
          [2, 0],
          [0, 1],
        ],
        [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 1],
        ],
      ),
    ).toThrow();
  });
});

describe('quadMetrics', () => {
  it('meldet fuer ein Rechteck keine Verzerrung und das Seitenverhaeltnis', () => {
    const metrics = quadMetrics([
      [0, 0],
      [210, 0],
      [210, 297],
      [0, 297],
    ]);
    expect(metrics.skew).toBeCloseTo(0, 9);
    expect(metrics.ratio).toBeCloseTo(297 / 210, 9);
    expect(metrics.convex).toBe(true);
  });

  it('erkennt vertauschte Griffe', () => {
    expect(
      quadMetrics([
        [0, 0],
        [210, 297],
        [210, 0],
        [0, 297],
      ]).convex,
    ).toBe(false);
  });

  it('misst die Verzerrung des Beispielfotos', () => {
    const metrics = quadMetrics(photoCorners);
    expect(metrics.skew).toBeGreaterThan(1);
    expect(metrics.skew).toBeLessThan(10);
  });
});

describe('Foto-Vorlage bearbeiten', async () => {
  const {
    SHEET_LETTER,
    addLines,
    createDocument,
    defaultCorners,
    moveCorner,
    setReference,
    setReferenceOpacity,
    setSheet,
    checkTutorialSchema,
  } = await import('../src/index.js');
  const blank = createDocument(SHEET_A4, 'x', 'x');
  const reference = {
    imageDataUrl: 'data:image/jpeg;base64,AA==',
    size: [2000, 1500] as const,
    corners: defaultCorners([2000, 1500]),
    opacity: 0.6,
  };

  it('setzt eine gueltige Vorlage und entfernt sie wieder', () => {
    const withPhoto = setReference(blank, reference);
    expect(checkTutorialSchema(withPhoto)).toEqual([]);
    expect('reference' in setReference(withPhoto, undefined)).toBe(false);
  });

  it('verschiebt einzelne Griffe und begrenzt die Deckkraft', () => {
    const withPhoto = setReference(blank, reference);
    expect(moveCorner(withPhoto, 1, [1900, 100]).reference?.corners[1]).toEqual([1900, 100]);
    expect(setReferenceOpacity(withPhoto, 3).reference?.opacity).toBe(1);
  });

  it('wechselt das Format nur auf einem leeren Blatt', () => {
    expect(setSheet(blank, SHEET_LETTER)?.sheet).toEqual(SHEET_LETTER);
    const drawn = addLines(blank, [{ id: 'L1', a: [0, 0], b: [210, 297], kind: 'valley' }]);
    expect(setSheet(drawn, SHEET_LETTER)).toBeUndefined();
  });

  it('meldet kaputte Vorlagen im Schema', () => {
    const broken = { ...blank, reference: { ...reference, opacity: 2, corners: [[0, 0]] } };
    expect(checkTutorialSchema(broken).map((issue) => issue.path)).toEqual([
      'reference.corners',
      'reference.opacity',
    ]);
  });
});
