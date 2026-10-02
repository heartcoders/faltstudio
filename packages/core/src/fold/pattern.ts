import type { Vec2 } from '../math/index.js';
import type { Crease, CreaseId, FaceId, VertexId } from '../model/index.js';
import {
  buildAdjacency,
  containsPoint,
  detectFaces,
  planarize,
  type CreaseGraph,
  type Face,
  type FaceAdjacency,
} from '../geometry/index.js';

/**
 * Alles, was sich aus den Quelldaten ableiten laesst und fuer das Falten
 * gebraucht wird. Wird bei jeder Aenderung im Editor neu berechnet.
 */
export interface FoldPattern {
  readonly graph: CreaseGraph;
  readonly faces: readonly Face[];
  readonly faceById: ReadonlyMap<FaceId, Face>;
  readonly creaseById: ReadonlyMap<CreaseId, Crease>;
  readonly positions: ReadonlyMap<VertexId, Vec2>;
  readonly adjacency: FaceAdjacency;
  readonly dangling: readonly CreaseId[];
}

export function preparePattern(source: CreaseGraph): FoldPattern {
  const graph = planarize(source);
  const { faces, dangling } = detectFaces(graph);
  return {
    graph,
    faces,
    faceById: new Map(faces.map((face) => [face.id, face])),
    creaseById: new Map(graph.creases.map((crease) => [crease.id, crease])),
    positions: new Map(graph.vertices.map((vertex) => [vertex.id, [vertex.x, vertex.y] as Vec2])),
    adjacency: buildAdjacency(faces),
    dangling,
  };
}

/** Flaeche des flachen Blatts, die den Punkt enthaelt. */
export function faceAt(pattern: FoldPattern, point: Vec2): Face | undefined {
  return pattern.faces.find((face) => containsPoint(face.polygon, point));
}
