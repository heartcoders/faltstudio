import type { Vec2 } from '../math/index.js';
import type { Crease, CreaseId, FaceId, VertexId } from '../model/index.js';
import { buildHalfEdgeMesh, nextHalfEdge, type HalfEdge, type HalfEdgeMesh } from './half-edge.js';
import type { CreaseGraph } from './planarize.js';
import { signedArea, type Polygon } from './polygon.js';
import { AREA_EPSILON } from './tolerance.js';
import { triangulate, type Triangle } from './triangulate.js';

export interface Face {
  /** Aus den Rand-Vertices abgeleitet, damit dieselbe Flaeche bei jedem Neuberechnen dieselbe ID bekommt. */
  readonly id: FaceId;
  readonly vertexIds: readonly VertexId[];
  /** Rand-Creases in Umlaufreihenfolge; `creaseIds[i]` verbindet `vertexIds[i]` und `vertexIds[i + 1]`. */
  readonly creaseIds: readonly CreaseId[];
  readonly polygon: Polygon;
  readonly area: number;
  readonly triangles: readonly Triangle[];
}

export interface FaceSet {
  readonly faces: readonly Face[];
  /** Linien mit losem Ende. Sie begrenzen keine Flaeche und werden der Validierung gemeldet. */
  readonly dangling: readonly CreaseId[];
}

function degrees(creases: readonly Crease[]): Map<VertexId, number> {
  const degree = new Map<VertexId, number>();
  for (const crease of creases) {
    degree.set(crease.a, (degree.get(crease.a) ?? 0) + 1);
    degree.set(crease.b, (degree.get(crease.b) ?? 0) + 1);
  }
  return degree;
}

/** Entfernt wiederholt Creases mit einem Endpunkt vom Grad 1 (lose Enden). */
export function pruneDangling(creases: readonly Crease[]): {
  kept: readonly Crease[];
  dangling: readonly CreaseId[];
} {
  let kept = creases;
  const dangling: CreaseId[] = [];
  for (;;) {
    const degree = degrees(kept);
    const loose = kept.filter((crease) => degree.get(crease.a) === 1 || degree.get(crease.b) === 1);
    if (loose.length === 0) return { kept, dangling };
    dangling.push(...loose.map((crease) => crease.id));
    kept = kept.filter((crease) => !loose.includes(crease));
  }
}

function traceCycle(
  mesh: HalfEdgeMesh,
  start: HalfEdge,
  visited: Set<number>,
): readonly HalfEdge[] {
  const cycle: HalfEdge[] = [];
  let edge = start;
  while (!visited.has(edge.index)) {
    visited.add(edge.index);
    cycle.push(edge);
    edge = nextHalfEdge(mesh, edge);
  }
  return cycle;
}

function canonicalFaceId(vertexIds: readonly VertexId[]): FaceId {
  const sorted = [...vertexIds].sort();
  return `f:${sorted.join(',')}`;
}

function toFace(mesh: HalfEdgeMesh, cycle: readonly HalfEdge[]): Face | undefined {
  const vertexIds = cycle.map((edge) => edge.from);
  const polygon = vertexIds.map((id) => mesh.positions.get(id) as Vec2);
  const area = signedArea(polygon);
  if (area <= AREA_EPSILON) return undefined;
  return {
    id: canonicalFaceId(vertexIds),
    vertexIds,
    creaseIds: cycle.map((edge) => edge.creaseId),
    polygon,
    area,
    triangles: triangulate(polygon),
  };
}

/**
 * Bestimmt alle beschraenkten Flaechen eines planaren Graphen. Jeder Umlauf
 * mit positiver Flaeche ist eine Flaeche; der negative Umlauf ist der Aussenrand.
 */
export function detectFaces(graph: CreaseGraph): FaceSet {
  const { kept, dangling } = pruneDangling(graph.creases);
  const mesh = buildHalfEdgeMesh(graph.vertices, kept);
  const visited = new Set<number>();
  const faces = mesh.halfEdges
    .filter((edge) => !visited.has(edge.index))
    .map((edge) => traceCycle(mesh, edge, visited))
    .filter((cycle) => cycle.length > 0)
    .flatMap((cycle) => toFace(mesh, cycle) ?? []);
  return { faces, dangling };
}
