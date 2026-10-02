import { describe, expect, it } from 'vitest';
import { hitRadius } from '../../tools/canvas-pointer.js';
import { nextKind } from './mobile-kind.js';

describe('Art-Umschalter', () => {
  it('wechselt reihum Tal → Berg → Flach → Tal', () => {
    expect(nextKind('valley')).toBe('mountain');
    expect(nextKind('mountain')).toBe('flat');
    expect(nextKind('flat')).toBe('valley');
  });
});

describe('Trefferradius', () => {
  const pointer = {
    phase: 'down',
    point: [0, 0],
    shift: false,
    alt: false,
    mmPerPixel: 0.5,
  } as const;

  it('ist auf Beruehrung groesser als mit der Maus', () => {
    expect(hitRadius({ ...pointer, touch: true })).toBeGreaterThan(hitRadius(pointer));
    expect(hitRadius(pointer)).toBe(5);
  });
});
