import { describe, expect, it } from 'vitest';
import { CREASE_KINDS, FORMAT_VERSION, SHEET_A4 } from '../src/index.js';

describe('model', () => {
  it('startet mit Formatversion 1', () => {
    expect(FORMAT_VERSION).toBe(1);
  });

  it('kennt genau die vier Crease-Arten', () => {
    expect(CREASE_KINDS).toEqual(['border', 'mountain', 'valley', 'flat']);
  });

  it('hat A4 im Hochformat in mm', () => {
    expect(SHEET_A4).toEqual({ width: 210, height: 297 });
  });
});
