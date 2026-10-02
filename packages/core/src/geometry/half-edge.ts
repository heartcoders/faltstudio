import { angleOf, sub, type Vec2 } from '../math/index.js';
import type { Crease, CreaseId, Vertex, VertexId } from '../model/index.js';

export interface HalfEdge {
  readonly index: number;
  readonly from: VertexId;
  readonly to: VertexId;
  readonly creaseId: CreaseId;
  /** Index der Gegenrichtung (to -> from). */
  readonly twin: number;
}

export interface HalfEdgeMesh {
  readonly halfEdges: readonly HalfEdge[];
  readonly positions: ReadonlyMap<VertexId, Vec2>;
  /** Ausgehende Half-Edges je Vertex, nach Winkel gegen den Uhrzeigersinn sortiert. */
  readonly outgoing: ReadonlyMap<VertexId, readonly number[]>;
}

function createHalfEdges(creases: readonly Crease[]): readonly HalfEdge[] {
  return creases.flatMap((crease, index) => [
    { index: 2 * index, from: crease.a, to: crease.b, creaseId: crease.id, twin: 2 * index + 1 },
    { index: 2 * index + 1, from: crease.b, to: crease.a, creaseId: crease.id, twin: 2 * index },
  ]);
}

function sortOutgoing(
  halfEdges: readonly HalfEdge[],
  positions: ReadonlyMap<VertexId, Vec2>,
): ReadonlyMap<VertexId, readonly number[]> {
  const direction = (edge: HalfEdge): number =>
    angleOf(sub(positions.get(edge.to) as Vec2, positions.get(edge.from) as Vec2));
  const outgoing = new Map<VertexId, HalfEdge[]>();
  for (const edge of halfEdges) outgoing.set(edge.from, [...(outgoing.get(edge.from) ?? []), edge]);
  return new Map(
    [...outgoing].map(([id, edges]) => [
      id,
      edges.sort((l, r) => direction(l) - direction(r)).map((e) => e.index),
    ]),
  );
}

export function buildHalfEdgeMesh(
  vertices: readonly Vertex[],
  creases: readonly Crease[],
): HalfEdgeMesh {
  const positions = new Map(vertices.map((vertex) => [vertex.id, [vertex.x, vertex.y] as Vec2]));
  const halfEdges = createHalfEdges(creases);
  return { halfEdges, positions, outgoing: sortOutgoing(halfEdges, positions) };
}

/**
 * Naechste Half-Edge im Umlauf mit der Flaeche zur Linken: am Zielvertex die
 * ausgehende Kante, die im Uhrzeigersinn direkt vor der Rueckrichtung liegt.
 */
export function nextHalfEdge(mesh: HalfEdgeMesh, edge: HalfEdge): HalfEdge {
  const around = mesh.outgoing.get(edge.to) ?? [];
  const position = around.indexOf(edge.twin);
  const nextIndex = around[(position - 1 + around.length) % around.length] as number;
  return mesh.halfEdges[nextIndex] as HalfEdge;
}
