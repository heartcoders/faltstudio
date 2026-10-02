import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  compose,
  createTimeline,
  dot3,
  flatState,
  foldedBounds,
  frontNormal,
  parseTutorial,
  preparePattern,
  restPose,
  rotate,
  transformOf,
  type FoldState,
} from '../src/index.js';

const dart = parseTutorial(
  readFileSync(new URL('../../../examples/dart-a4.json', import.meta.url), 'utf8'),
);
const pattern = preparePattern(dart);
const timeline = createTimeline(pattern, dart.steps);
const finished = timeline.boundaries.at(-1) as FoldState;

const faceNear = (x: number, y: number) =>
  pattern.faces.find((face) => {
    const xs = face.polygon.map((point) => point[0]);
    const ys = face.polygon.map((point) => point[1]);
    return (
      x > Math.min(...xs) &&
      x < Math.max(...xs) &&
      y > Math.min(...ys) &&
      y < Math.max(...ys) &&
      face.area > 50
    );
  });

describe('restPose', () => {
  const pose = restPose(pattern, finished).transform;
  const up = (faceId: string) =>
    Math.abs(dot3(rotate(pose.r, frontNormal(transformOf(finished, faceId))), [0, 0, 1]));

  it('legt beim fertigen Pfeil die Fluegel waagerecht und stellt den Rumpf senkrecht', () => {
    const wing = faceNear(200, 20);
    const body = faceNear(110, 20);
    if (!wing || !body) throw new Error('Flaechen fehlen');
    expect(up(wing.id)).toBeGreaterThan(0.999);
    expect(up(body.id)).toBeLessThan(0.01);
  });

  it('haengt den Rumpf unter die Fluegel', () => {
    const posed = foldedBounds(pattern, finished, pose);
    const wing = faceNear(200, 20);
    if (!wing) throw new Error('Fluegel fehlt');
    const wingHeight = foldedBounds({ ...pattern, faces: [wing] }, finished, pose).max[2];
    expect(posed.min[2]).toBeLessThan(wingHeight - 10);
    expect(posed.max[2] - wingHeight).toBeLessThan(1);
  });

  it('laesst ein flaches Blatt flach liegen', () => {
    const flat = flatState(pattern);
    const identityLike = restPose(pattern, flat).transform;
    expect(Math.abs(dot3(rotate(identityLike.r, [0, 0, 1]), [0, 0, 1]))).toBeCloseTo(1, 9);
  });

  it('ist eine starre Bewegung: Abstaende bleiben erhalten', () => {
    const a = compose(pose, transformOf(finished, pattern.faces[0]?.id ?? ''));
    const b = transformOf(finished, pattern.faces[0]?.id ?? '');
    const span = (transform: typeof a) => {
      const p = rotate(transform.r, [100, 0, 0]);
      return Math.hypot(...p);
    };
    expect(span(a)).toBeCloseTo(span(b), 9);
  });
});
