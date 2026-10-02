import { afterEach, describe, expect, it } from 'vitest';
import { setLocale } from '@faltstudio/ui';

import { stepCount } from '../../state/step-count.js';
import { newSheetInfo, statusWord } from './fan-info.js';
import { displayTitle, formatDate, type CardData } from './model-card-data.js';
import { statusLabel } from './model-status.js';

const untitled: CardData = { title: '', steps: 0, sheet: 'A4', lines: [], readable: true };

afterEach(() => setLocale('de'));

describe('Startseite auf Englisch', () => {
  it('nennt Pruefstand, Schritte und neues Blatt englisch', () => {
    setLocale('en');
    expect(statusWord({ kind: 'error', count: 1 })).toBe('1 error');
    expect(statusLabel({ kind: 'error', count: 2 })).toBe('× 2 errors');
    expect(statusWord({ kind: 'checked' })).toBe('Checked');
    expect(stepCount(8)).toBe('8 steps');
    expect(newSheetInfo(3)).toMatchObject({ index: '04', title: 'New model' });
    expect(displayTitle(untitled)).toBe('Untitled');
  });

  it('wechselt beim Umschalten zurueck ins Deutsche', () => {
    setLocale('en');
    setLocale('de');
    expect(stepCount(1)).toBe('1 Schritt');
    expect(displayTitle(untitled)).toBe('Ohne Titel');
    expect(formatDate('2026-09-28T10:00:00Z')).toBe('28.09.');
  });
});
