import type { CreaseId, FaceId } from '../model/index.js';
import type { Face } from './faces.js';

export interface FaceAdjacency {
  /** Flaechen links und rechts jeder Crease; Randlinien haben nur eine. */
  readonly facesByCrease: ReadonlyMap<CreaseId, readonly FaceId[]>;
  /** Nachbarn je Flaeche mit der trennenden Crease. */
  readonly neighbours: ReadonlyMap<
    FaceId,
    readonly { readonly face: FaceId; readonly crease: CreaseId }[]
  >;
}

function groupByCrease(faces: readonly Face[]): Map<CreaseId, FaceId[]> {
  const byCrease = new Map<CreaseId, FaceId[]>();
  for (const face of faces) {
    for (const creaseId of face.creaseIds)
      byCrease.set(creaseId, [...(byCrease.get(creaseId) ?? []), face.id]);
  }
  return byCrease;
}

/** Grundlage der Faltlogik: welche Flaechen teilen welche Crease (Handover, Geometrie). */
export function buildAdjacency(faces: readonly Face[]): FaceAdjacency {
  const facesByCrease = groupByCrease(faces);
  const neighbours = new Map<FaceId, { face: FaceId; crease: CreaseId }[]>(
    faces.map((face) => [face.id, []]),
  );
  for (const [crease, pair] of facesByCrease) {
    const [left, right] = pair;
    if (!left || !right) continue;
    neighbours.get(left)?.push({ face: right, crease });
    neighbours.get(right)?.push({ face: left, crease });
  }
  return { facesByCrease, neighbours };
}
