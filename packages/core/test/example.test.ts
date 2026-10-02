import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  applyTransform,
  createTimeline,
  dot3,
  faceAt,
  frontNormal,
  parseTutorial,
  preparePattern,
  serializeTutorial,
  stateAt,
  transformOf,
  TutorialFormatError,
  type FoldState,
} from '../src/index.js';

const text = readFileSync(new URL('../../../examples/dart-a4.json', import.meta.url), 'utf8');
const tutorial = parseTutorial(text);
const pattern = preparePattern(tutorial);
const timeline = createTimeline(pattern, tutorial.steps);
const finished = timeline.boundaries.at(-1) as FoldState;

const normalOf = (state: FoldState, point: readonly [number, number]) => {
  const face = pattern.faces.find(
    (candidate) => candidate.polygon.length > 0 && containsCentroidNear(candidate.id, point),
  );
  return frontNormal(transformOf(state, face?.id ?? ''));
};

function containsCentroidNear(faceId: string, point: readonly [number, number]): boolean {
  const face = pattern.faceById.get(faceId);
  if (!face) return false;
  const inside = face.polygon;
  let hit = false;
  for (let i = 0, j = inside.length - 1; i < inside.length; j = i++) {
    const [xi, yi] = inside[i] ?? [0, 0];
    const [xj, yj] = inside[j] ?? [0, 0];
    if (
      yi > point[1] !== yj > point[1] &&
      point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi
    )
      hit = !hit;
  }
  return hit;
}

describe('examples/dart-a4.json', () => {
  it('ist ein gueltiges Tutorial mit acht Schritten', () => {
    expect(tutorial.steps).toHaveLength(8);
    expect(pattern.dangling).toEqual([]);
  });

  it('bleibt beim Laden und Speichern Byte fuer Byte gleich', () => {
    expect(serializeTutorial(parseTutorial(text))).toBe(text);
  });

  it('faltet alle acht Schritte ohne Befund', () => {
    expect(timeline.issues).toEqual([]);
  });

  it('liegt nach Schritt 6 flach und nur halb so breit', () => {
    const afterSix = timeline.boundaries[6] as FoldState;
    for (const face of pattern.faces) {
      for (const [x, y] of face.polygon) {
        const [wx, , wz] = applyTransform(transformOf(afterSix, face.id), [x, y, 0]);
        expect(Math.abs(wz)).toBeLessThan(1e-6);
        expect(wx).toBeGreaterThan(105 - 1e-6);
      }
    }
  });

  it('stellt am Ende beide Fluegel senkrecht zum Rumpf, zu entgegengesetzten Seiten', () => {
    const body = normalOf(finished, [110, 20]);
    expect(Math.abs(dot3(body, normalOf(finished, [200, 20])))).toBeLessThan(1e-9);
    expect(Math.abs(dot3(body, normalOf(finished, [10, 20])))).toBeLessThan(1e-9);
    const tip = (point: readonly [number, number]) => {
      const face = pattern.faces.find((candidate) => containsCentroidNear(candidate.id, point));
      return applyTransform(transformOf(finished, face?.id ?? ''), [point[0], point[1], 0]);
    };
    expect(tip([200, 20])[2]).toBeGreaterThan(40);
    expect(tip([10, 20])[2]).toBeLessThan(-40);
  });

  it('haelt die Nase an Ort und Stelle', () => {
    for (const face of pattern.faces.filter((candidate) =>
      candidate.polygon.some(([x, y]) => x === 105 && y === 297),
    )) {
      const position = applyTransform(transformOf(finished, face.id), [105, 297, 0]);
      [105, 297, 0].forEach((expected, index) => expect(position[index]).toBeCloseTo(expected, 6));
    }
  });

  it('interpoliert zwischen den Schritten stetig', () => {
    const early = stateAt(timeline, 3, 0.999);
    const done = stateAt(timeline, 4, 0);
    for (const face of pattern.faces) {
      const a = applyTransform(transformOf(early, face.id), [150, 150, 0]);
      const b = applyTransform(transformOf(done, face.id), [150, 150, 0]);
      expect(Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])).toBeLessThan(1);
    }
  });
});

describe('parseTutorial', () => {
  it('meldet alle Strukturfehler mit Pfad', () => {
    const broken = JSON.stringify({
      ...JSON.parse(text),
      creases: [{ id: 'X', a: 'nope', b: 'nope', kind: 'squash' }],
    });
    try {
      parseTutorial(broken);
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(TutorialFormatError);
      const paths = (error as TutorialFormatError).issues.map((issue) => issue.path);
      expect(paths).toEqual(
        expect.arrayContaining([
          'creases[0].a',
          'creases[0].kind',
          'steps[0].folds[0].creaseIds[0]',
        ]),
      );
    }
  });

  it('lehnt Dateien aus einer neueren Formatversion ab', () => {
    expect(() => parseTutorial(JSON.stringify({ ...JSON.parse(text), formatVersion: 99 }))).toThrow(
      /neuer/,
    );
  });

  it('lehnt kaputtes JSON verstaendlich ab', () => {
    expect(() => parseTutorial('{')).toThrow(TutorialFormatError);
  });
});

describe('Vorfalten und wieder oeffnen', () => {
  const heightAt = (progress: number): number => {
    const state = stateAt(timeline, 0, progress);
    const face = faceAt(pattern, [20, 20]);
    return applyTransform(transformOf(state, face?.id ?? ''), [20, 20, 0])[2];
  };

  it('hebt die Haelfte beim Falten und beim Oeffnen nach oben, nie durchs Blatt', () => {
    expect(heightAt(0.25)).toBeGreaterThan(50);
    expect(heightAt(0.75)).toBeGreaterThan(50);
    expect(heightAt(0.6)).toBeGreaterThan(0);
    expect(heightAt(0.9)).toBeGreaterThan(0);
  });
});
