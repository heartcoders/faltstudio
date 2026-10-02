import { describe, expect, it } from 'vitest';

import { editorHref, readRoute } from '../../state/route.js';
import { clampSelection, fanPlacement } from './fan-layout.js';
import { statusWord } from './fan-info.js';

describe('Faecher der Startseite', () => {
  it('hebt das gewaehlte Blatt ueber alle anderen', () => {
    const lifted = fanPlacement(2, 2, 8);
    const neighbour = fanPlacement(3, 2, 8);
    expect(lifted.shift).toBe(0);
    expect(lifted.zMobile).toBeGreaterThan(neighbour.zMobile);
    expect(lifted.zDesktop).toBeGreaterThan(fanPlacement(7, 2, 8).zDesktop);
  });

  it('legt bis acht Blaetter auf dem Desktop fest um die Mitte', () => {
    expect(fanPlacement(0, 5, 8).spread).toBe(-3.5);
    expect(fanPlacement(7, 0, 8).spread).toBe(3.5);
    expect(fanPlacement(0, 5, 8).hiddenDesktop).toBe(false);
  });

  it('folgt bei vielen Blaettern der Auswahl und blendet ferne aus', () => {
    expect(fanPlacement(0, 9, 12).spread).toBe(-9);
    expect(fanPlacement(0, 9, 12).hiddenDesktop).toBe(true);
    expect(fanPlacement(0, 4, 12).hiddenMobile).toBe(true);
    expect(fanPlacement(1, 4, 12).hiddenMobile).toBe(false);
  });

  it('haelt die Auswahl an den Enden fest', () => {
    expect(clampSelection(0, -1, 4)).toBe(0);
    expect(clampSelection(3, 1, 4)).toBe(3);
    expect(clampSelection(1, 1, 4)).toBe(2);
  });

  it('nennt den Pruefstand kurz', () => {
    expect(statusWord({ kind: 'error', count: 2 })).toBe('2 Fehler');
    expect(statusWord({ kind: 'checked' })).toBe('Geprüft');
  });
});

describe('Format fuer ein neues Blatt', () => {
  it('reicht Letter ueber die URL an den Editor', () => {
    const href = editorHref({ kind: 'new', format: 'letter' }, 'photo');
    expect(href).toBe('./editor.html?new&format=letter&mode=photo');
    expect(readRoute(href.slice(href.indexOf('?')))).toEqual({ kind: 'new', format: 'letter' });
  });

  it('bleibt ohne Angabe bei A4', () => {
    expect(readRoute('?new')).toEqual({ kind: 'new', format: 'a4' });
    expect(editorHref({ kind: 'new', format: 'a4' })).toBe('./editor.html?new');
  });
});
