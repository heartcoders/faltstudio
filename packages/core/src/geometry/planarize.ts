import type { Crease, Vertex, VertexId } from '../model/index.js';
import type { Vec2 } from '../math/index.js';
import { intersectSegments, projectOnSegment, type Segment } from './segment.js';
import { VertexPool } from './vertex-pool.js';
import { MERGE_TOLERANCE_MM } from './tolerance.js';

export interface CreaseGraph {
  readonly vertices: readonly Vertex[];
  readonly creases: readonly Crease[];
}

interface PlacedCrease {
  readonly crease: Crease;
  readonly segment: Segment;
}

const position = (vertex: Vertex): Vec2 => [vertex.x, vertex.y];

function placeCreases(graph: CreaseGraph): readonly PlacedCrease[] {
  const byId = new Map(graph.vertices.map((vertex) => [vertex.id, vertex]));
  return graph.creases.flatMap((crease) => {
    const a = byId.get(crease.a);
    const b = byId.get(crease.b);
    if (!a || !b) throw new Error(`Crease ${crease.id} verweist auf unbekannten Vertex.`);
    return [{ crease, segment: { a: position(a), b: position(b) } }];
  });
}

function collectVertices(
  graph: CreaseGraph,
  placed: readonly PlacedCrease[],
  tolerance: number,
): VertexPool {
  const pool = new VertexPool(tolerance);
  for (const vertex of graph.vertices) pool.add(vertex.id, position(vertex));
  for (let i = 0; i < placed.length; i++) {
    for (let j = i + 1; j < placed.length; j++) addIntersection(pool, placed[i], placed[j]);
  }
  return pool;
}

function addIntersection(pool: VertexPool, first?: PlacedCrease, second?: PlacedCrease): void {
  if (!first || !second) return;
  const hit = intersectSegments(first.segment, second.segment);
  if (!hit) return;
  const [low, high] = [first.crease.id, second.crease.id].sort();
  pool.add(`x:${low}/${high}`, hit.point);
}

function verticesOn(placed: PlacedCrease, pool: VertexPool): readonly VertexId[] {
  return pool.vertices
    .map((vertex) => ({
      id: vertex.id,
      t: projectOnSegment(placed.segment, position(vertex), pool.tolerance),
    }))
    .filter((hit): hit is { id: VertexId; t: number } => hit.t !== undefined)
    .sort((left, right) => left.t - right.t)
    .map((hit) => hit.id)
    .filter((id, index, ids) => id !== ids[index - 1]);
}

function splitCrease(placed: PlacedCrease, pool: VertexPool): readonly Crease[] {
  const chain = verticesOn(placed, pool);
  const pieces = chain.slice(1).map((b, index) => ({ a: chain[index] as VertexId, b }));
  const { crease } = placed;
  if (pieces.length === 1) return pieces.map((piece) => ({ ...crease, ...piece }));
  return pieces.map((piece, index) => ({ ...crease, id: `${crease.id}.${index + 1}`, ...piece }));
}

const edgeKey = (crease: Crease): string => [crease.a, crease.b].sort().join('|');

function dropDuplicates(creases: readonly Crease[]): readonly Crease[] {
  const seen = new Set<string>();
  return creases.filter((crease) => {
    const key = edgeKey(crease);
    if (crease.a === crease.b || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Macht aus beliebigen Linien einen planaren Graphen: Schnittpunkte und
 * T-Stoesse werden Vertices, jede Linie zerfaellt in atomare Segmente.
 *
 * IDs bleiben stabil: ungeteilte Creases behalten ihre ID, geteilte heissen
 * `L4.1`, `L4.2` … in Richtung a -> b, neue Schnittpunkte `x:L4/H2`.
 * Ein bereits planarer Graph kommt unveraendert zurueck.
 */
export function planarize(graph: CreaseGraph, tolerance: number = MERGE_TOLERANCE_MM): CreaseGraph {
  const placed = placeCreases(graph);
  const pool = collectVertices(graph, placed, tolerance);
  const creases = dropDuplicates(placed.flatMap((entry) => splitCrease(entry, pool)));
  const used = new Set(creases.flatMap((crease) => [crease.a, crease.b]));
  return { vertices: pool.vertices.filter((vertex) => used.has(vertex.id)), creases };
}
