import { describe, expect, it } from 'vitest';
import { DIAL, angleFrom, pointAt, snapAngle } from './dial-geometry.js';

describe('dial-geometry', () => {
  it('legt 0 Grad links, 90 oben und 180 rechts auf den Bogen', () => {
    expect(pointAt(0).x).toBeCloseTo(DIAL.cx - DIAL.radius);
    expect(pointAt(90).y).toBeCloseTo(DIAL.cy - DIAL.radius);
    expect(pointAt(180).x).toBeCloseTo(DIAL.cx + DIAL.radius);
  });

  it('berechnet den Winkel eines Punkts auf dem Bogen zurueck', () => {
    expect(angleFrom(pointAt(128))).toBeCloseTo(128);
  });

  it('klemmt Punkte unterhalb der Grundlinie auf 0 oder 180', () => {
    expect(angleFrom({ x: DIAL.cx - 50, y: DIAL.cy + 20 })).toBe(0);
    expect(angleFrom({ x: DIAL.cx + 50, y: DIAL.cy + 20 })).toBe(180);
  });

  it('rastet innerhalb von 3 Grad bei 90 und 180 ein', () => {
    expect(snapAngle(87.5)).toBe(90);
    expect(snapAngle(177)).toBe(180);
    expect(snapAngle(86)).toBe(86);
  });
});
