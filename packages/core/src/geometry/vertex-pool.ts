import { distance, type Vec2 } from '../math/index.js';
import type { Vertex, VertexId } from '../model/index.js';
import { MERGE_TOLERANCE_MM } from './tolerance.js';

/**
 * Sammelt Punkte und fuehrt alle innerhalb der Toleranz zu einem Vertex
 * zusammen. Der erste Punkt gewinnt ID und Koordinaten.
 */
export class VertexPool {
  readonly #vertices: Vertex[] = [];

  constructor(readonly tolerance: number = MERGE_TOLERANCE_MM) {}

  get vertices(): readonly Vertex[] {
    return this.#vertices;
  }

  /** Liefert die ID des bestehenden Vertex in Reichweite oder legt `id` neu an. */
  add(id: VertexId, point: Vec2): VertexId {
    const existing = this.find(point);
    if (existing) return existing.id;
    this.#vertices.push({ id, x: point[0], y: point[1] });
    return id;
  }

  find(point: Vec2): Vertex | undefined {
    return this.#vertices.find((vertex) => distance([vertex.x, vertex.y], point) <= this.tolerance);
  }
}
