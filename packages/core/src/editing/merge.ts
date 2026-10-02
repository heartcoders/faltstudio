import type { Crease, CreaseId, VertexId } from '../model/index.js';
import { turn, type CreaseGraph } from '../geometry/index.js';
import type { Vec2 } from '../math/index.js';

const baseId = (id: CreaseId): CreaseId => id.replace(/\.\d+$/, '');

function incident(creases: readonly Crease[], vertex: VertexId): readonly Crease[] {
  return creases.filter((crease) => crease.a === vertex || crease.b === vertex);
}

const otherEnd = (crease: Crease, vertex: VertexId): VertexId =>
  crease.a === vertex ? crease.b : crease.a;

function mergeable(graph: CreaseGraph, vertex: VertexId, pair: readonly Crease[]): boolean {
  const [first, second] = pair;
  if (!first || !second || first.kind !== second.kind) return false;
  const position = (id: VertexId): Vec2 => {
    const found = graph.vertices.find((candidate) => candidate.id === id);
    return [found?.x ?? 0, found?.y ?? 0];
  };
  return (
    Math.abs(
      turn(position(otherEnd(first, vertex)), position(vertex), position(otherEnd(second, vertex))),
    ) < 1e-6
  );
}

function mergedId(first: Crease, second: Crease): CreaseId {
  return baseId(first.id) === baseId(second.id) ? baseId(first.id) : first.id;
}

function mergeAt(graph: CreaseGraph, vertex: VertexId): CreaseGraph | undefined {
  const pair = incident(graph.creases, vertex);
  if (pair.length !== 2 || !mergeable(graph, vertex, pair)) return undefined;
  const [first, second] = pair as [Crease, Crease];
  const merged: Crease = {
    ...first,
    id: mergedId(first, second),
    a: otherEnd(first, vertex),
    b: otherEnd(second, vertex),
  };
  return {
    vertices: graph.vertices.filter((candidate) => candidate.id !== vertex),
    creases: [...graph.creases.filter((crease) => crease !== first && crease !== second), merged],
  };
}

/**
 * Fuehrt gerade durchlaufende Stuecke gleicher Art an Vertices vom Grad 2
 * wieder zusammen, z.B. nachdem die Linie geloescht wurde, die sie geteilt hat.
 * `L5.1` + `L5.2` werden wieder `L5`. Verwaiste Vertices fallen weg.
 */
export function mergeCollinear(graph: CreaseGraph): CreaseGraph {
  let current = graph;
  for (let changed = true; changed;) {
    changed = false;
    for (const vertex of current.vertices) {
      const merged = mergeAt(current, vertex.id);
      if (!merged) continue;
      current = merged;
      changed = true;
      break;
    }
  }
  const used = new Set(current.creases.flatMap((crease) => [crease.a, crease.b]));
  return {
    vertices: current.vertices.filter((vertex) => used.has(vertex.id)),
    creases: current.creases,
  };
}
