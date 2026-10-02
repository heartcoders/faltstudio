import { compose, rotationAbout } from '../math/index.js';
import type { CreaseId, FaceId, Fold } from '../model/index.js';
import { projectOnSegment } from '../geometry/index.js';
import { foldAxis, type FoldAxis } from './axis.js';
import { failure, success, type FoldResult } from './fold-error.js';
import { restack } from './layers.js';
import { sandwichedLayers } from './sandwich.js';
import { movingSide } from './moving-side.js';
import { faceAt, type FoldPattern } from './pattern.js';
import { transformOf, type FoldState } from './state.js';

/** Ab dieser Abweichung von 180 Grad gilt eine Faltung nicht mehr als flach gelegt. */
const FLAT_FOLD_TOLERANCE_DEG = 1;

export interface AppliedFold {
  readonly state: FoldState;
  readonly moving: ReadonlySet<FaceId>;
  readonly axis: FoldAxis;
}

function liesOnCrease(pattern: FoldPattern, fold: Fold): boolean {
  return pattern.graph.creases.some((crease) => {
    const a = pattern.positions.get(crease.a);
    const b = pattern.positions.get(crease.b);
    return (
      a !== undefined &&
      b !== undefined &&
      projectOnSegment({ a, b }, fold.movingPoint) !== undefined
    );
  });
}

function resolveMovingSide(pattern: FoldPattern, fold: Fold): FoldResult<ReadonlySet<FaceId>> {
  const unknown = fold.creaseIds.filter((id) => !pattern.creaseById.has(id));
  if (unknown.length > 0)
    return failure('unknown-crease', 'Die Faltung nennt unbekannte Creases.', unknown);
  if (fold.creaseIds.length === 0) return failure('no-crease', 'Die Faltung hat keine Crease.');
  if (liesOnCrease(pattern, fold))
    return failure('point-on-crease', 'Der Punkt der beweglichen Seite liegt auf einer Linie.');
  const seed = faceAt(pattern, fold.movingPoint);
  if (!seed)
    return failure('point-outside', 'Der Punkt der beweglichen Seite liegt nicht auf dem Blatt.');
  const moving = movingSide(pattern, seed.id, new Set<CreaseId>(fold.creaseIds));
  if (moving.size === pattern.faces.length) {
    return failure(
      'no-moving-side',
      'Die Creases trennen das Blatt nicht in zwei Seiten.',
      fold.creaseIds,
    );
  }
  return success(moving);
}

function rotate(
  state: FoldState,
  moving: ReadonlySet<FaceId>,
  axis: FoldAxis,
  degrees: number,
): FoldState {
  const rotation = rotationAbout(axis.origin, axis.direction, (degrees * Math.PI) / 180);
  const transforms = new Map(state.transforms);
  for (const faceId of moving)
    transforms.set(faceId, compose(rotation, transformOf(state, faceId)));
  return { transforms, lifts: state.lifts };
}

const isFlatFold = (degrees: number): boolean =>
  Math.abs(Math.abs(degrees) - 180) <= FLAT_FOLD_TOLERANCE_DEG;

/**
 * Fuehrt eine Faltung bis zum Anteil `progress` (0..1) aus. Die Achse kommt aus
 * dem aktuellen Zustand; die Transformationen werden auf die vorhandenen
 * aufgesetzt. Erst bei vollstaendiger 180-Grad-Faltung werden Lagen neu gestapelt.
 */
export function applyFold(
  pattern: FoldPattern,
  state: FoldState,
  fold: Fold,
  progress = 1,
): FoldResult<AppliedFold> {
  const side = resolveMovingSide(pattern, fold);
  if (!side.ok) return side;
  const axis = foldAxis(pattern, state, fold.creaseIds, side.value);
  if (!axis.ok) return axis;
  const moving = withSandwiched(pattern, state, side.value, axis.value, fold);
  const degrees = fold.angle * Math.min(1, Math.max(0, progress));
  const rotated = rotate(state, moving, axis.value, degrees);
  const complete = progress >= 1 && isFlatFold(fold.angle);
  const valley = fold.angle > 0;
  const next = complete
    ? restack({ pattern, before: state, after: rotated, moving, axis: axis.value, valley })
    : rotated;
  return success({ state: next, moving, axis: axis.value });
}

function withSandwiched(
  pattern: FoldPattern,
  state: FoldState,
  moving: ReadonlySet<FaceId>,
  axis: FoldAxis,
  fold: Fold,
): ReadonlySet<FaceId> {
  const extra = sandwichedLayers(pattern, state, moving, axis, new Set(fold.creaseIds));
  return extra.size === 0 ? moving : new Set([...moving, ...extra]);
}
