import { describe, expect, it } from 'vitest';
import {
  buildAdjacency,
  detectFaces,
  linesToGraph,
  planarize,
  signedArea,
  triangulate,
  type Face,
  type LineInput,
  type Polygon,
} from '../src/index.js';
import {
  squareWithDiagonals,
  squareWithHalfLine,
  squareWithLooseEnd,
} from './fixtures/patterns.js';

const build = (lines: readonly LineInput[]) => planarize(linesToGraph(lines));

const triangleArea = (face: Face): number =>
  face.triangles.reduce((sum, [a, b, c]) => {
    const polygon: Polygon = [face.polygon[a], face.polygon[b], face.polygon[c]].map(
      (point) => point ?? [0, 0],
    );
    return sum + signedArea(polygon);
  }, 0);

describe('planarize', () => {
  it('fuegt den Diagonalen-Schnittpunkt als Vertex ein und teilt beide Diagonalen', () => {
    const graph = build(squareWithDiagonals);
    expect(graph.vertices).toHaveLength(5);
    expect(graph.creases).toHaveLength(8);
    expect(graph.creases.map((crease) => crease.id)).toEqual(
      expect.arrayContaining(['D1.1', 'D1.2', 'D2.1', 'D2.2', 'B-bottom']),
    );
  });

  it('teilt Randlinien an T-Stoessen', () => {
    const ids = build(squareWithHalfLine).creases.map((crease) => crease.id);
    expect(ids).toEqual(
      expect.arrayContaining(['B-bottom.1', 'B-bottom.2', 'B-top.1', 'B-top.2', 'M']),
    );
  });

  it('fuehrt Punkte innerhalb von 0,01 mm zusammen', () => {
    const graph = build([
      { id: 'A', a: [0, 0], b: [10, 0], kind: 'valley' },
      { id: 'B', a: [10.005, 0.004], b: [10, 10], kind: 'valley' },
    ]);
    expect(graph.vertices).toHaveLength(3);
  });

  it('haelt Punkte ausserhalb der Toleranz getrennt', () => {
    const graph = build([
      { id: 'A', a: [0, 0], b: [10, 0], kind: 'valley' },
      { id: 'B', a: [10.02, 0], b: [20, 0], kind: 'valley' },
    ]);
    expect(graph.vertices).toHaveLength(4);
  });

  it('entfernt kollineare Doppellinien', () => {
    const graph = build([
      { id: 'A', a: [0, 0], b: [10, 0], kind: 'valley' },
      { id: 'B', a: [0, 0], b: [10, 0], kind: 'mountain' },
    ]);
    expect(graph.creases.map((crease) => crease.id)).toEqual(['A']);
  });

  it('teilt ueberlappende kollineare Linien an den inneren Endpunkten', () => {
    const graph = build([
      { id: 'A', a: [0, 0], b: [10, 0], kind: 'valley' },
      { id: 'B', a: [5, 0], b: [15, 0], kind: 'valley' },
    ]);
    expect(graph.creases).toHaveLength(3);
  });

  it('ist idempotent: ein planarer Graph kommt unveraendert zurueck', () => {
    const once = build(squareWithDiagonals);
    expect(planarize(once)).toEqual(once);
  });
});

describe('detectFaces', () => {
  it('findet vier gleich grosse Dreiecke im Quadrat mit Diagonalen', () => {
    const { faces, dangling } = detectFaces(build(squareWithDiagonals));
    expect(faces).toHaveLength(4);
    expect(dangling).toEqual([]);
    for (const face of faces) expect(face.area).toBeCloseTo(2500);
  });

  it('meldet lose Enden und laesst sie aus der Flaechenbildung heraus', () => {
    const { faces, dangling } = detectFaces(build(squareWithLooseEnd));
    expect(dangling).toEqual(['S']);
    expect(faces).toHaveLength(1);
    expect(faces[0]?.area).toBeCloseTo(10_000);
  });

  it('vergibt beim Neuberechnen aus derselben Datei dieselben Flaechen-IDs', () => {
    const stored = build(squareWithDiagonals);
    const shuffled = {
      vertices: [...stored.vertices].reverse(),
      creases: [...stored.creases].reverse(),
    };
    const original = detectFaces(stored)
      .faces.map((face) => face.id)
      .sort();
    expect(
      detectFaces(shuffled)
        .faces.map((face) => face.id)
        .sort(),
    ).toEqual(original);
  });

  it('benennt Schnittpunkte unabhaengig von der Reihenfolge der beiden Linien', () => {
    const ids = (lines: readonly LineInput[]) => build(lines).vertices.map((vertex) => vertex.id);
    const [first, second] = [
      squareWithDiagonals.slice(4),
      [...squareWithDiagonals.slice(4)].reverse(),
    ];
    expect(ids(first).filter((id) => id.startsWith('x:'))).toEqual(
      ids(second).filter((id) => id.startsWith('x:')),
    );
  });

  it('trianguliert jede Flaeche flaechentreu', () => {
    for (const face of detectFaces(build(squareWithHalfLine)).faces) {
      expect(triangleArea(face)).toBeCloseTo(face.area);
    }
  });
});

describe('triangulate', () => {
  it('zerlegt ein nicht konvexes L in n - 2 Dreiecke', () => {
    const shape: Polygon = [
      [0, 0],
      [20, 0],
      [20, 10],
      [10, 10],
      [10, 20],
      [0, 20],
    ];
    const triangles = triangulate(shape);
    expect(triangles).toHaveLength(4);
  });

  it('ignoriert Vertices auf geraden Kanten', () => {
    const shape: Polygon = [
      [0, 0],
      [5, 0],
      [10, 0],
      [10, 10],
      [0, 10],
    ];
    expect(triangulate(shape)).toHaveLength(2);
  });

  it('lehnt Polygone im Uhrzeigersinn ab', () => {
    expect(() =>
      triangulate([
        [0, 0],
        [0, 10],
        [10, 0],
      ]),
    ).toThrow();
  });
});

describe('buildAdjacency', () => {
  it('verbindet Nachbarflaechen ueber die gemeinsame Crease, Randlinien nur einseitig', () => {
    const { faces } = detectFaces(build(squareWithDiagonals));
    const adjacency = buildAdjacency(faces);
    expect(adjacency.facesByCrease.get('D1.1')).toHaveLength(2);
    expect(adjacency.facesByCrease.get('B-bottom')).toHaveLength(1);
    for (const face of faces) expect(adjacency.neighbours.get(face.id)).toHaveLength(2);
  });
});
