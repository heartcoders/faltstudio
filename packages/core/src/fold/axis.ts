import {
  applyTransform,
  distanceToLine,
  dot3,
  frontNormal,
  lift,
  normalize3,
  scale3,
  sub3,
  tangentAt,
  type Vec2,
  type Vec3,
} from '../math/index.js';
import type { CreaseId, FaceId } from '../model/index.js';
import { centroid } from '../geometry/index.js';
import { failure, success, type FoldResult } from './fold-error.js';
import type { FoldPattern } from './pattern.js';
import { transformOf, type FoldState } from './state.js';

/** Endpunkte, die weiter als 0,05 mm von der gemeinsamen Achse liegen, gelten als nicht kollinear. */
export const AXIS_TOLERANCE_MM = 0.05;

export interface FoldAxis {
  readonly origin: Vec3;
  /** Einheitsrichtung; positive Rotation schliesst die Falte zur Vorderseite der liegenden Seite (Tal). */
  readonly direction: Vec3;
  /** Vorderseiten-Normale der liegenbleibenden Flaeche: "vorn" fuer diese Faltung. */
  readonly front: Vec3;
}

function worldPoint(pattern: FoldPattern, state: FoldState, faceId: FaceId, vertex: string): Vec3 {
  const [x, y] = pattern.positions.get(vertex) as Vec2;
  return applyTransform(transformOf(state, faceId), lift(x, y));
}

function creaseEndpoints(
  pattern: FoldPattern,
  state: FoldState,
  creaseId: CreaseId,
): readonly Vec3[] {
  const crease = pattern.creaseById.get(creaseId);
  const [face] = pattern.adjacency.facesByCrease.get(creaseId) ?? [];
  if (!crease || !face) return [];
  return [worldPoint(pattern, state, face, crease.a), worldPoint(pattern, state, face, crease.b)];
}

interface Hinge {
  readonly moving: FaceId;
  readonly stationary: FaceId;
}

function findHinge(
  pattern: FoldPattern,
  creaseIds: readonly CreaseId[],
  moving: ReadonlySet<FaceId>,
): Hinge | undefined {
  for (const creaseId of creaseIds) {
    const pair = pattern.adjacency.facesByCrease.get(creaseId) ?? [];
    const movingFace = pair.find((face) => moving.has(face));
    const stationaryFace = pair.find((face) => !moving.has(face));
    if (movingFace && stationaryFace) return { moving: movingFace, stationary: stationaryFace };
  }
  return undefined;
}

function faceCenter(pattern: FoldPattern, state: FoldState, faceId: FaceId): Vec3 {
  const face = pattern.faceById.get(faceId);
  const [x, y] = centroid(face?.polygon ?? []);
  return applyTransform(transformOf(state, faceId), lift(x, y));
}

/**
 * Achse aus den aktuellen 3D-Positionen der Crease-Endpunkte. Prueft, dass alle
 * Segmente auf einer Geraden liegen, und richtet die Achse an der liegenden
 * Flaeche aus: Ein positiver Winkel schliesst die Falte zur Vorderseite hin
 * (Tal), ein negativer oeffnet sie bzw. faltet nach hinten (Berg).
 *
 * Massgeblich ist die liegende Seite, weil sie sich nicht bewegt. Die Lage der
 * beweglichen Seite taugt nicht als Bezug: Liegt sie nach einer Talfalte schon
 * umgeklappt auf, kehrt sich ihr Drehsinn um, und „-180 Grad“ zum Oeffnen
 * wuerde sie einmal durchs Blatt herum drehen.
 */
export function foldAxis(
  pattern: FoldPattern,
  state: FoldState,
  creaseIds: readonly CreaseId[],
  moving: ReadonlySet<FaceId>,
): FoldResult<FoldAxis> {
  const points = creaseIds.flatMap((id) => creaseEndpoints(pattern, state, id));
  const [origin, end] = points;
  if (!origin || !end)
    return failure('no-crease', 'Die Faltung hat keine gueltige Crease.', creaseIds);
  const direction = normalize3(sub3(end, origin));
  const off = creaseIds.filter((id) =>
    creaseEndpoints(pattern, state, id).some(
      (point) => distanceToLine(point, origin, direction) > AXIS_TOLERANCE_MM,
    ),
  );
  if (off.length > 0)
    return failure(
      'not-collinear',
      'Die Segmente liegen im aktuellen Zustand nicht auf einer Geraden.',
      off,
    );
  const hinge = findHinge(pattern, creaseIds, moving);
  if (!hinge)
    return failure(
      'everything-moves',
      'Keine Crease trennt bewegliche und liegende Seite.',
      creaseIds,
    );
  const front = frontNormal(transformOf(state, hinge.stationary));
  const lifting = dot3(
    tangentAt(faceCenter(pattern, state, hinge.stationary), origin, direction),
    front,
  );
  return success({ origin, direction: lifting > 0 ? scale3(direction, -1) : direction, front });
}
