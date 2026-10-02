import { sheetBorder, type LineInput } from '../../src/index.js';

export const SQUARE = { width: 100, height: 100 } as const;

export const squareWithDiagonals: readonly LineInput[] = [
  ...sheetBorder(SQUARE),
  { id: 'D1', a: [0, 0], b: [100, 100], kind: 'valley' },
  { id: 'D2', a: [100, 0], b: [0, 100], kind: 'mountain' },
];

export const squareWithHalfLine: readonly LineInput[] = [
  ...sheetBorder(SQUARE),
  { id: 'M', a: [50, 0], b: [50, 100], kind: 'valley' },
];

export const squareWithLooseEnd: readonly LineInput[] = [
  ...sheetBorder(SQUARE),
  { id: 'S', a: [50, 0], b: [50, 50], kind: 'valley' },
];
