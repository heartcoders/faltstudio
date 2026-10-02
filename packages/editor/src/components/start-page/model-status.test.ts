import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { editorHref, readStartMode } from '../../state/route.js';
import { modelStatus, statusLabel } from './model-status.js';

const dart = readFileSync(new URL('../../../../../examples/dart-a4.json', import.meta.url), 'utf8');

describe('Pruefstand auf der Karte', () => {
  it('meldet das mitgelieferte Beispiel als geprueft', () => {
    expect(modelStatus(dart)).toEqual({ kind: 'checked' });
  });

  it('haelt ein Modell ohne Schritte fuer einen Entwurf', () => {
    const tutorial = { ...JSON.parse(dart), steps: [] };
    expect(statusLabel(modelStatus(JSON.stringify(tutorial)))).toBe('Entwurf');
  });

  it('zaehlt eine unlesbare Datei als Fehler', () => {
    expect(statusLabel(modelStatus('{kaputt'))).toBe('× 1 Fehler');
  });
});

describe('Startmodus des Editors', () => {
  it('oeffnet „Aus Foto“ im Foto-Modus', () => {
    const href = editorHref({ kind: 'new' }, 'photo');
    expect(href).toBe('./editor.html?new&mode=photo');
    expect(readStartMode(href.slice(href.indexOf('?')))).toBe('photo');
    expect(readStartMode('?new')).toBe('lines');
  });
});
