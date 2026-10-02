import type { Vec2 } from '../math/index.js';
import type { CreaseKind, Sheet } from '../model/index.js';
import type { CreaseGraph } from './planarize.js';

/** Eine gezeichnete Linie vor dem Schneiden, wie sie aus Editor oder Beispiel kommt. */
export interface LineInput {
  readonly id: string;
  readonly a: Vec2;
  readonly b: Vec2;
  readonly kind: CreaseKind;
}

/** Die vier Blattkanten als Randlinien, gegen den Uhrzeigersinn ab links unten. */
export function sheetBorder(sheet: Sheet): readonly LineInput[] {
  const { width, height } = sheet;
  return [
    { id: 'B-bottom', a: [0, 0], b: [width, 0], kind: 'border' },
    { id: 'B-right', a: [width, 0], b: [width, height], kind: 'border' },
    { id: 'B-top', a: [width, height], b: [0, height], kind: 'border' },
    { id: 'B-left', a: [0, height], b: [0, 0], kind: 'border' },
  ];
}

/**
 * Wandelt Linien in einen (noch nicht planaren) Graphen. Jeder Endpunkt wird
 * ein eigener Vertex `L4:a` / `L4:b`; `planarize` fuehrt gleiche Punkte zusammen.
 */
export function linesToGraph(lines: readonly LineInput[]): CreaseGraph {
  return {
    vertices: lines.flatMap((line) => [
      { id: `${line.id}:a`, x: line.a[0], y: line.a[1] },
      { id: `${line.id}:b`, x: line.b[0], y: line.b[1] },
    ]),
    creases: lines.map((line) => ({
      id: line.id,
      a: `${line.id}:a`,
      b: `${line.id}:b`,
      kind: line.kind,
    })),
  };
}
