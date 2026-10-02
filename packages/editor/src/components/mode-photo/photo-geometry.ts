import type { Reference, Sheet } from '@faltstudio/core';

export type Point = readonly [number, number];

/** Dashed Ziel-Rechteck im Foto: Blattformat, zentriert auf die Griffe, mittlere Hoehe. */
export function targetRect(
  corners: readonly Point[],
  sheet: Sheet,
): { readonly x: number; readonly y: number; readonly width: number; readonly height: number } {
  const [p1, p2, p3, p4] = corners as [Point, Point, Point, Point];
  const center: Point = [(p1[0] + p2[0] + p3[0] + p4[0]) / 4, (p1[1] + p2[1] + p3[1] + p4[1]) / 4];
  const height =
    (Math.hypot(p4[0] - p1[0], p4[1] - p1[1]) + Math.hypot(p3[0] - p2[0], p3[1] - p2[1])) / 2;
  const width = (height * sheet.width) / sheet.height;
  return { x: center[0] - width / 2, y: center[1] - height / 2, width, height };
}

/** Griffe mit laufendem Ziehen eingerechnet. */
export function effectiveCorners(
  reference: Reference,
  draft: { readonly index: number; readonly point: Point } | undefined,
): readonly Point[] {
  return reference.corners.map((corner, index) =>
    draft && draft.index === index ? draft.point : corner,
  );
}

export const pixelLabel = ([x, y]: Point): string =>
  `${String(Math.round(x)).padStart(4, '0')}/${String(Math.round(y)).padStart(4, '0')}`;
