import { describe, expect, it } from 'vitest';
import { chipLabel } from './viewer-state.js';

describe('chipLabel', () => {
  it('benennt jeden Zustand wie im Design R4', () => {
    expect(chipLabel('ready', 'auto', 0)).toBe('Bereit · Ecke greifen');
    expect(chipLabel('dragging', 'drag', 92.4)).toBe('Ziehen · ∠ 92°');
    expect(chipLabel('dragging', 'release', 92)).toBe('Losgelassen · ∠ 92°');
    expect(chipLabel('snapped', 'drag', 180)).toBe('Eingerastet · 180°');
  });

  it('spricht Englisch mit fester Sprache', () => {
    expect(chipLabel('ready', 'auto', 0, 'en')).toBe('Ready · grab the corner');
    expect(chipLabel('dragging', 'auto', 45, 'en')).toBe('Folding · ∠ 45°');
  });
});
