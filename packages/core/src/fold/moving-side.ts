import type { CreaseId, FaceId } from '../model/index.js';
import type { FoldPattern } from './pattern.js';

/**
 * Flood-Fill im Adjazenzgraphen ab `seed`. Die Creases der Faltung sperren,
 * alle anderen verbinden. Ergebnis ist die bewegliche Seite.
 */
export function movingSide(
  pattern: FoldPattern,
  seed: FaceId,
  blocked: ReadonlySet<CreaseId>,
): ReadonlySet<FaceId> {
  const reached = new Set<FaceId>([seed]);
  const queue: FaceId[] = [seed];
  for (let face = queue.shift(); face !== undefined; face = queue.shift()) {
    for (const neighbour of pattern.adjacency.neighbours.get(face) ?? []) {
      if (blocked.has(neighbour.crease) || reached.has(neighbour.face)) continue;
      reached.add(neighbour.face);
      queue.push(neighbour.face);
    }
  }
  return reached;
}
