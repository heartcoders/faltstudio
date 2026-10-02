import { afterEach, describe, expect, it } from 'vitest';
import { setLocale } from '@faltstudio/ui';
import { snapText } from '../components/mode-lines/readout.js';
import { kindLabel } from '../components/mobile/mobile-kind.js';
import { stepCount } from '../state/step-count.js';
import { editorText } from './editor.js';

afterEach(() => setLocale('de'));

describe('Editor-Texte', () => {
  it('liefert Deutsch als Standard der Tests', () => {
    expect(editorText().modes.lines).toBe('Linien');
    expect(stepCount(8)).toBe('8 Schritte');
  });

  it('wechselt nach setLocale auf Englisch, auch in abgeleiteten Texten', () => {
    setLocale('en');
    expect(editorText().modes.lines).toBe('Lines');
    expect(editorText().issuesLabel(1, 2)).toBe('Issues: 1 error, 2 warnings');
    expect(stepCount(1)).toBe('1 step');
    expect(kindLabel('border')).toBe('Flat');
    expect(snapText({ snap: 'vertex' })).toBe('Snap · corner');
  });
});
