import { applyTransform, dot3, frontNormal, sub3, type Vec2, type Vec3 } from '../math/index.js';
import type { CreaseId, FaceId } from '../model/index.js';
import { centroid } from '../geometry/index.js';
import type { FoldPattern } from './pattern.js';
import { liftOf, transformOf, type FoldState } from './state.js';
import type { Timeline } from './timeline.js';

export type FinalKind = 'mountain' | 'valley' | 'unfolded';

/** Unter diesem Abstand (mm) zur Ebene der Nachbarflaeche gilt eine Crease als nicht gefaltet. */
const UNFOLDED_MM = 0.01;

function liftedCentroid(pattern: FoldPattern, state: FoldState, faceId: FaceId): Vec3 {
  const [x, y] = centroid(pattern.faceById.get(faceId)?.polygon ?? []);
  return applyTransform(transformOf(state, faceId), [x, y, liftOf(state, faceId)]);
}

function pointOn(pattern: FoldPattern, state: FoldState, faceId: FaceId, vertexId: string): Vec3 {
  const [x, y] = pattern.positions.get(vertexId) as Vec2;
  return applyTransform(transformOf(state, faceId), [x, y, liftOf(state, faceId)]);
}

/**
 * Wie eine Crease im Zustand `state` tatsaechlich gefaltet ist: liegt die
 * Nachbarflaeche vor der Vorderseite der einen Flaeche, ist es ein Tal, dahinter
 * ein Berg. Bei 180 Grad entscheidet die Lagenreihenfolge.
 */
export function foldedKind(pattern: FoldPattern, state: FoldState, creaseId: CreaseId): FinalKind {
  const [first, second] = pattern.adjacency.facesByCrease.get(creaseId) ?? [];
  const crease = pattern.creaseById.get(creaseId);
  if (!first || !second || !crease) return 'unfolded';
  const anchor = pointOn(pattern, state, first, crease.a);
  const offset = dot3(
    sub3(liftedCentroid(pattern, state, second), anchor),
    frontNormal(transformOf(state, first)),
  );
  if (Math.abs(offset) < UNFOLDED_MM) return 'unfolded';
  return offset > 0 ? 'valley' : 'mountain';
}

export interface KindMismatch {
  readonly creaseId: CreaseId;
  readonly stored: 'mountain' | 'valley' | 'flat';
  readonly folded: FinalKind;
}

/**
 * Creases, deren gespeicherte Art nicht zum Endzustand der Schritte passt.
 * Ungefaltete Berg- oder Tallinien zaehlen mit, gefaltete Hilfslinien auch.
 */
export function kindMismatches(timeline: Timeline): readonly KindMismatch[] {
  const pattern = timeline.pattern;
  const finished = timeline.boundaries.at(-1) as FoldState;
  return pattern.graph.creases.flatMap((crease): KindMismatch[] => {
    if (crease.kind === 'border') return [];
    const folded = foldedKind(pattern, finished, crease.id);
    const matches = crease.kind === 'flat' ? folded === 'unfolded' : folded === crease.kind;
    return matches ? [] : [{ creaseId: crease.id, stored: crease.kind, folded }];
  });
}
