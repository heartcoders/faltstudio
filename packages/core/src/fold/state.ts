import { IDENTITY, type RigidTransform } from '../math/index.js';
import type { FaceId } from '../model/index.js';
import type { FoldPattern } from './pattern.js';

/**
 * Faltzustand: eine starre Transformation pro Flaeche relativ zur flachen Lage,
 * dazu ein Lagen-Versatz in mm entlang der eigenen Vorderseiten-Normale. Der
 * Versatz ist rein visuell und fliesst nie in Achsen oder Tests der Geometrie ein.
 */
export interface FoldState {
  readonly transforms: ReadonlyMap<FaceId, RigidTransform>;
  readonly lifts: ReadonlyMap<FaceId, number>;
}

export function flatState(pattern: FoldPattern): FoldState {
  return {
    transforms: new Map(pattern.faces.map((face) => [face.id, IDENTITY])),
    lifts: new Map(pattern.faces.map((face) => [face.id, 0])),
  };
}

export const transformOf = (state: FoldState, faceId: FaceId): RigidTransform =>
  state.transforms.get(faceId) ?? IDENTITY;

export const liftOf = (state: FoldState, faceId: FaceId): number => state.lifts.get(faceId) ?? 0;
