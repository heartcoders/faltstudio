import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseTutorial, preparePattern, serializeFold, toFold } from '../src/index.js';

const dart = parseTutorial(
  readFileSync(new URL('../../../examples/dart-a4.json', import.meta.url), 'utf8'),
);

describe('FOLD-Export', () => {
  const fold = toFold(dart);
  const pattern = preparePattern(dart);

  it('schreibt Knoten, Kanten und Flaechen vollstaendig', () => {
    expect(fold.vertices_coords).toHaveLength(pattern.graph.vertices.length);
    expect(fold.edges_vertices).toHaveLength(pattern.graph.creases.length);
    expect(fold.faces_vertices).toHaveLength(pattern.faces.length);
  });

  it('ordnet Linienarten den FOLD-Kuerzeln und Winkeln zu', () => {
    const byKind = new Map(pattern.graph.creases.map((crease, index) => [crease.kind, index]));
    const index = byKind.get('mountain') ?? -1;
    expect(fold.edges_assignment[index]).toBe('M');
    expect(fold.edges_foldAngle[index]).toBe(-180);
    expect(
      fold.edges_assignment.filter((assignment) => assignment === 'B').length,
    ).toBeGreaterThanOrEqual(4);
  });

  it('verweist nur auf vorhandene Knoten', () => {
    const count = fold.vertices_coords.length;
    const ids = [...fold.edges_vertices.flat(), ...fold.faces_vertices.flat()];
    expect(ids.every((id) => Number.isInteger(id) && id >= 0 && id < count)).toBe(true);
  });

  it('ist gueltiges JSON mit Spezifikation 1.1 und Einheit mm', () => {
    const parsed = JSON.parse(serializeFold(dart)) as { file_spec: number; frame_unit: string };
    expect(parsed.file_spec).toBe(1.1);
    expect(parsed.frame_unit).toBe('mm');
  });
});
