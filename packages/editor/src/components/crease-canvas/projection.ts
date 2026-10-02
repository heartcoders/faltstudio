import type { Sheet } from '@faltstudio/core';

export type Point = readonly [number, number];

export interface ScreenPoint {
  readonly x: number;
  readonly y: number;
}

export interface Projection {
  readonly scale: number;
  readonly width: number;
  readonly height: number;
  readonly point: (model: Point) => ScreenPoint;
}

interface ProjectionOptions {
  readonly scale: number;
  readonly pad: number;
}

/** Modell (mm, y nach oben) auf SVG (px, y nach unten) mit Rand fuer Bemassung. */
export function createProjection(sheet: Sheet, { scale, pad }: ProjectionOptions): Projection {
  return {
    scale,
    width: sheet.width * scale + 2 * pad,
    height: sheet.height * scale + 2 * pad,
    point: ([x, y]) => ({ x: pad + x * scale, y: pad + (sheet.height - y) * scale }),
  };
}
