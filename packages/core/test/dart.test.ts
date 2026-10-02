import { describe, expect, it } from 'vitest';
import { SAMPLE_LINES } from '../src/fixtures/index.js';
import {
  SHEET_A4,
  buildAdjacency,
  detectFaces,
  linesToGraph,
  planarize,
  sheetBorder,
  type CreaseGraph,
  type FaceSet,
} from '../src/index.js';
import { dartThroughStepSix } from './fixtures/dart.js';

const SHEET_AREA = SHEET_A4.width * SHEET_A4.height;

function eulerFaceCount(graph: CreaseGraph): number {
  return graph.creases.length - graph.vertices.length + 1;
}

function totalArea({ faces }: FaceSet): number {
  return faces.reduce((sum, face) => sum + face.area, 0);
}

describe('Pfeil (Dart) auf A4', () => {
  const graph = planarize(linesToGraph(dartThroughStepSix));
  const faceSet = detectFaces(graph);

  it('zerfaellt in acht Sektoren um die Nase', () => {
    expect(graph.vertices).toHaveLength(12);
    expect(graph.creases).toHaveLength(19);
    expect(faceSet.faces).toHaveLength(8);
  });

  it('erfuellt die Euler-Formel und deckt genau das Blatt ab', () => {
    expect(faceSet.faces).toHaveLength(eulerFaceCount(graph));
    expect(totalArea(faceSet)).toBeCloseTo(SHEET_AREA, 6);
  });

  it("hat oben links das Eckdreieck zwischen Blattkante und L4'", () => {
    const smallest = Math.min(...faceSet.faces.map((face) => face.area));
    expect(smallest).toBeCloseTo(0.5 * 105 * 105 * Math.tan(Math.PI / 8), 6);
  });

  it('verbindet jede Faltlinie genau zwei Flaechen', () => {
    const adjacency = buildAdjacency(faceSet.faces);
    const folds = graph.creases.filter((crease) => crease.kind !== 'border');
    for (const crease of folds) expect(adjacency.facesByCrease.get(crease.id)).toHaveLength(2);
  });
});

describe('Design-Muster mit Hilfslinien als Belastungstest', () => {
  const graph = planarize(linesToGraph([...sheetBorder(SHEET_A4), ...SAMPLE_LINES]));
  const faceSet = detectFaces(graph);

  it('schneidet alle Linien und deckt das Blatt luecken- und ueberlappungsfrei ab', () => {
    expect(faceSet.dangling).toEqual([]);
    expect(faceSet.faces).toHaveLength(eulerFaceCount(graph));
    expect(totalArea(faceSet)).toBeCloseTo(SHEET_AREA, 6);
  });

  it('trianguliert jede Flaeche', () => {
    for (const face of faceSet.faces) {
      expect(face.triangles.length).toBeGreaterThanOrEqual(1);
    }
  });
});
