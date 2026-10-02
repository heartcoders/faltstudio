import type { Vec2 } from '../math/index.js';
import type { Sheet } from '../model/index.js';

/** Zeilenweise 3x3-Matrix einer ebenen Projektion, h[8] ist auf 1 normiert. */
export type Homography = readonly [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

export type Quad = readonly [Vec2, Vec2, Vec2, Vec2];

function solveLinear(matrix: number[][], vector: number[]): number[] {
  const size = vector.length;
  const rows = matrix.map((row, index) => [...row, vector[index] as number]);
  for (let column = 0; column < size; column++) {
    const pivot = rows
      .slice(column)
      .reduce(
        (best, row, offset) =>
          Math.abs(row[column] as number) > Math.abs(rows[best]?.[column] as number)
            ? column + offset
            : best,
        column,
      );
    [rows[column], rows[pivot]] = [rows[pivot] as number[], rows[column] as number[]];
    const lead = rows[column]?.[column] as number;
    if (Math.abs(lead) < 1e-12) throw new Error('Die vier Punkte liegen auf einer Geraden.');
    for (let row = 0; row < size; row++) {
      if (row === column) continue;
      const factor = (rows[row]?.[column] as number) / lead;
      rows[row] = (rows[row] as number[]).map(
        (value, index) => value - factor * ((rows[column] as number[])[index] as number),
      );
    }
  }
  return rows.map((row, index) => (row[size] as number) / (row[index] as number));
}

/**
 * Homographie, die `from[i]` auf `to[i]` abbildet (Direct Linear Transform mit
 * vier Punktpaaren). Wirft, wenn drei der Punkte auf einer Geraden liegen.
 */
export function homographyFromQuads(from: Quad, to: Quad): Homography {
  const matrix: number[][] = [];
  const vector: number[] = [];
  from.forEach(([x, y], index) => {
    const [u, v] = to[index] as Vec2;
    matrix.push([x, y, 1, 0, 0, 0, -u * x, -u * y]);
    vector.push(u);
    matrix.push([0, 0, 0, x, y, 1, -v * x, -v * y]);
    vector.push(v);
  });
  const [a, b, c, d, e, f, g, h] = solveLinear(matrix, vector) as [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
  ];
  return [a, b, c, d, e, f, g, h, 1];
}

export function applyHomography(matrix: Homography, [x, y]: Vec2): Vec2 {
  const [a, b, c, d, e, f, g, h, i] = matrix;
  const w = g * x + h * y + i;
  return [(a * x + b * y + c) / w, (d * x + e * y + f) / w];
}

export function invertHomography(matrix: Homography): Homography {
  const [a, b, c, d, e, f, g, h, i] = matrix;
  const determinant = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
  if (Math.abs(determinant) < 1e-12) throw new Error('Homographie ist nicht umkehrbar.');
  const inverse = [
    e * i - f * h,
    c * h - b * i,
    b * f - c * e,
    f * g - d * i,
    a * i - c * g,
    c * d - a * f,
    d * h - e * g,
    b * g - a * h,
    a * e - b * d,
  ].map((value) => value / determinant);
  const last = inverse[8] as number;
  return inverse.map((value) => value / last) as unknown as Homography;
}

/**
 * Ziel-Ecken im Blatt in der Reihenfolge der Griffe P1 bis P4: links oben,
 * rechts oben, rechts unten, links unten (Ursprung des Blatts links unten).
 */
export const sheetCorners = (sheet: Sheet): Quad => [
  [0, sheet.height],
  [sheet.width, sheet.height],
  [sheet.width, 0],
  [0, 0],
];

/** Foto-Pixel -> Blatt-mm fuer die vier gesetzten Griffe. */
export const photoToSheet = (corners: Quad, sheet: Sheet): Homography =>
  homographyFromQuads(corners, sheetCorners(sheet));

export interface QuadMetrics {
  /** Groesste Abweichung eines Eckwinkels von 90 Grad. */
  readonly skew: number;
  /** Verhaeltnis mittlere Hoehe / mittlere Breite des Vierecks im Foto. */
  readonly ratio: number;
  /** Faltet sich das Viereck (Griffe vertauscht)? */
  readonly convex: boolean;
}

function cornerAngle(previous: Vec2, corner: Vec2, next: Vec2): number {
  const a = [previous[0] - corner[0], previous[1] - corner[1]] as const;
  const b = [next[0] - corner[0], next[1] - corner[1]] as const;
  return (
    (Math.acos((a[0] * b[0] + a[1] * b[1]) / (Math.hypot(...a) * Math.hypot(...b))) * 180) / Math.PI
  );
}

const turnSign = (a: Vec2, b: Vec2, c: Vec2): number =>
  Math.sign((b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]));

/** Pruefwerte fuer die Entzerrung (S1, Panel F). */
export function quadMetrics(corners: Quad): QuadMetrics {
  const at = (index: number): Vec2 => corners[(index + 4) % 4] as Vec2;
  const angles = corners.map((_, index) => cornerAngle(at(index - 1), at(index), at(index + 1)));
  const length = (from: number, to: number): number =>
    Math.hypot(at(to)[0] - at(from)[0], at(to)[1] - at(from)[1]);
  const width = (length(0, 1) + length(3, 2)) / 2;
  const height = (length(1, 2) + length(0, 3)) / 2;
  const turns = corners.map((_, index) => turnSign(at(index - 1), at(index), at(index + 1)));
  return {
    skew: Math.max(...angles.map((angle) => Math.abs(angle - 90))),
    ratio: height / width,
    convex: turns.every((turn) => turn === turns[0] && turn !== 0),
  };
}
