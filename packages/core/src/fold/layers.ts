import { applyTransform, cross3, dot3, frontNormal, lift, sub3, type Vec3 } from '../math/index.js';
import type { FaceId } from '../model/index.js';
import type { FoldAxis } from './axis.js';
import type { FoldPattern } from './pattern.js';
import { liftOf, transformOf, type FoldState } from './state.js';

/** Visueller Abstand zwischen zwei Lagen (Handover: etwa 0,05 mm). */
export const LAYER_STEP_MM = 0.05;

const PARALLEL = 0.999;
const PLANE_TOLERANCE_MM = 0.5;
const OVERLAP_SHRINK_MM = 0.5;

interface Box {
  readonly minU: number;
  readonly maxU: number;
  readonly minV: number;
  readonly maxV: number;
}

function faceCorners(pattern: FoldPattern, state: FoldState, faceId: FaceId): readonly Vec3[] {
  const face = pattern.faceById.get(faceId);
  const transform = transformOf(state, faceId);
  return (face?.polygon ?? []).map(([x, y]) => applyTransform(transform, lift(x, y)));
}

function boxInPlane(corners: readonly Vec3[], axis: FoldAxis): Box {
  const across = cross3(axis.front, axis.direction);
  const us = corners.map((point) => dot3(sub3(point, axis.origin), axis.direction));
  const vs = corners.map((point) => dot3(sub3(point, axis.origin), across));
  return {
    minU: Math.min(...us),
    maxU: Math.max(...us),
    minV: Math.min(...vs),
    maxV: Math.max(...vs),
  };
}

function overlaps(a: Box, b: Box): boolean {
  const gap = OVERLAP_SHRINK_MM;
  return (
    a.minU + gap < b.maxU && b.minU + gap < a.maxU && a.minV + gap < b.maxV && b.minV + gap < a.maxV
  );
}

function inLandingPlane(
  pattern: FoldPattern,
  state: FoldState,
  faceId: FaceId,
  axis: FoldAxis,
): boolean {
  if (Math.abs(dot3(frontNormal(transformOf(state, faceId)), axis.front)) < PARALLEL) return false;
  const corners = faceCorners(pattern, state, faceId);
  return corners.every(
    (point) => Math.abs(dot3(sub3(point, axis.origin), axis.front)) < PLANE_TOLERANCE_MM,
  );
}

/** Hoehe einer Flaeche ueber der Landeebene: ihr Versatz entlang "vorn" der Faltung. */
function height(state: FoldState, faceId: FaceId, front: Vec3): number {
  return liftOf(state, faceId) * Math.sign(dot3(frontNormal(transformOf(state, faceId)), front));
}

interface RestackInput {
  readonly pattern: FoldPattern;
  readonly before: FoldState;
  readonly after: FoldState;
  readonly moving: ReadonlySet<FaceId>;
  readonly axis: FoldAxis;
  readonly valley: boolean;
}

function landingHeight(input: RestackInput, movingBoxes: readonly Box[]): number {
  const { pattern, after, moving, axis, valley } = input;
  const below = pattern.faces
    .map((face) => face.id)
    .filter((id) => !moving.has(id) && inLandingPlane(pattern, after, id, axis))
    .filter((id) =>
      movingBoxes.some((box) => overlaps(box, boxInPlane(faceCorners(pattern, after, id), axis))),
    )
    .map((id) => height(after, id, axis.front));
  if (below.length === 0) return valley ? -LAYER_STEP_MM : LAYER_STEP_MM;
  return valley ? Math.max(...below) : Math.min(...below);
}

/**
 * Nach einer 180-Grad-Faltung landet die bewegliche Seite oben auf dem Stapel
 * (Tal) bzw. darunter (Berg). Das Umklappen kehrt die Reihenfolge innerhalb der
 * beweglichen Seite um: was oben lag, liegt danach direkt auf dem Stapel.
 */
export function restack(input: RestackInput): FoldState {
  const { pattern, before, after, moving, axis, valley } = input;
  const landing = [...moving].filter((id) => inLandingPlane(pattern, after, id, axis));
  if (landing.length === 0) return after;
  const boxes = landing.map((id) => boxInPlane(faceCorners(pattern, after, id), axis));
  const base = landingHeight(input, boxes);
  const previous = landing.map((id) => height(before, id, axis.front));
  const [top, bottom] = [Math.max(...previous), Math.min(...previous)];
  const lifts = new Map(after.lifts);
  landing.forEach((id, index) => {
    const old = previous[index] ?? 0;
    const target = valley
      ? base + LAYER_STEP_MM + (top - old)
      : base - LAYER_STEP_MM - (old - bottom);
    lifts.set(id, target * Math.sign(dot3(frontNormal(transformOf(after, id)), axis.front)));
  });
  return { transforms: after.transforms, lifts };
}
