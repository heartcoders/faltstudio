import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  checkFlatFoldability,
  checkLines,
  createTimeline,
  kindMismatches,
  parseTutorial,
  preparePattern,
} from '../src/index.js';

const folder = new URL('../../../examples/', import.meta.url);
const files = readdirSync(folder).filter((name) => name.endsWith('.json'));

describe.each(files)('Beispiel %s', (file) => {
  const tutorial = parseTutorial(readFileSync(new URL(file, folder), 'utf8'));
  const pattern = preparePattern(tutorial);
  const timeline = createTimeline(pattern, tutorial.steps);

  it('faltet jeden Schritt ohne Befund', () => {
    expect(timeline.issues).toEqual([]);
  });

  it('ist flach faltbar und hat keine losen Enden', () => {
    expect(checkFlatFoldability(pattern.graph)).toEqual([]);
    expect(checkLines(pattern.graph, tutorial.sheet, pattern.dangling)).toEqual([]);
  });

  it('hat Linienarten passend zum Endzustand', () => {
    expect(kindMismatches(timeline)).toEqual([]);
  });
});

it('liefert mindestens drei Beispiele mit', () => {
  expect(files.length).toBeGreaterThanOrEqual(3);
});
