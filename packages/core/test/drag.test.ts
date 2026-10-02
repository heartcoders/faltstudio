import { describe, expect, it } from 'vitest';
import {
  dragAngle,
  dragProgress,
  flatState,
  foldHandle,
  gripAt,
  linesToGraph,
  preparePattern,
  sheetBorder,
  type FoldHandle,
  type Vec3,
} from '../src/index.js';
import { SQUARE } from './fixtures/patterns.js';

const halves = preparePattern(
  linesToGraph([...sheetBorder(SQUARE), { id: 'M', a: [50, 0], b: [50, 100], kind: 'valley' }]),
);

function handleFor(angle: number): FoldHandle {
  const result = foldHandle(halves, flatState(halves), {
    creaseIds: ['M'],
    movingPoint: [75, 50],
    angle,
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
}

/** Strahl von einer Kamera auf der Achse (vor dem Blatt) durch einen Punkt der Rotationsebene. */
const rayThrough = (point: Vec3, from: Vec3 = [50, -200, 0]) => ({
  origin: from,
  direction: [point[0] - from[0], point[1] - from[1], point[2] - from[2]] as Vec3,
});

describe('foldHandle', () => {
  it('greift am weitesten Punkt der beweglichen Seite an', () => {
    const handle = handleFor(180);
    expect(handle.grip[0]).toBeCloseTo(100);
    expect(handle.radius).toBeCloseTo(50);
    expect(handle.moving.size).toBe(1);
  });

  it('meldet Fehler der Faltung statt zu werfen', () => {
    const result = foldHandle(halves, flatState(halves), {
      creaseIds: ['X'],
      movingPoint: [75, 50],
      angle: 180,
    });
    expect(result.ok).toBe(false);
  });
});

describe('dragAngle', () => {
  it('liest 90 Grad, wenn der Zeiger senkrecht ueber der Achse steht', () => {
    const handle = handleFor(180);
    const angle = dragAngle(handle, rayThrough([50, handle.grip[1], 50]));
    expect(angle).toBeCloseTo(90, 6);
    expect(dragProgress(handle, angle)).toBeCloseTo(0.5, 6);
  });

  it('folgt der Bahn des Greifpunkts', () => {
    const handle = handleFor(180);
    const angle = dragAngle(handle, rayThrough(gripAt(handle, 0.3)));
    expect(angle).toBeCloseTo(54, 6);
  });

  it('bleibt ueber 180 Grad hinweg stetig', () => {
    const handle = handleFor(180);
    const beyond = rayThrough(gripAt(handle, 190 / 180));
    expect(dragAngle(handle, beyond, 175)).toBeCloseTo(190, 6);
    expect(dragProgress(handle, 190)).toBe(1);
  });

  it('bildet bei Bergfalten auf negative Winkel und denselben Fortschritt ab', () => {
    const handle = handleFor(-180);
    const angle = dragAngle(handle, rayThrough([50, handle.grip[1], -50]));
    expect(angle).toBeCloseTo(-90, 6);
    expect(dragProgress(handle, angle)).toBeCloseTo(0.5, 6);
  });

  it('funktioniert auch, wenn die Kamera genau seitlich auf die Rotationsebene blickt', () => {
    const handle = handleFor(180);
    const angle = dragAngle(handle, { origin: [-200, 50, 50], direction: [1, 0, 0] });
    expect(angle).toBeCloseTo(90, 6);
  });
});
