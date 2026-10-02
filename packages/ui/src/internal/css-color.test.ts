import { describe, expect, it } from 'vitest';
import { toHexColor } from './css-color.js';

describe('toHexColor', () => {
  it('wandelt moderne rgb-Syntax ohne Kommas in Hex', () => {
    expect(toHexColor('rgb(11 11 11)')).toBe('#0b0b0b');
  });

  it('laesst Hex unveraendert', () => {
    expect(toHexColor('#d6d6d6')).toBe('#d6d6d6');
  });
});
