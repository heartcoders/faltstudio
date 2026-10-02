import { afterEach, describe, expect, it } from 'vitest';
import { assertPublicSurface, expectAccessible, mount } from '../../internal/testing.js';
import './define.js';
import type { Sheet } from './sheet.js';

const grip = (el: Sheet) => el.shadowRoot?.querySelector('.grip') as HTMLButtonElement;
const body = (el: Sheet) => el.shadowRoot?.querySelector('.body') as HTMLElement;

afterEach(() => {
  document.body.replaceChildren();
});

describe('fl-sheet', () => {
  it('ist zugaenglich', async () => {
    const el = await mount<Sheet>(
      '<fl-sheet label="Einrasten"><p slot="head">Kopf</p><p>Inhalt</p></fl-sheet>',
    );
    await expectAccessible(el);
  });

  it('zeigt schwebend den Inhalt ohne Griff', async () => {
    const el = await mount<Sheet>('<fl-sheet label="X" floating><p>Inhalt</p></fl-sheet>');
    expect(getComputedStyle(body(el)).display).toBe('block');
    expect(getComputedStyle(grip(el)).display).toBe('none');
  });

  it('zeigt eingeklappt nur den Kopf', async () => {
    const el = await mount<Sheet>('<fl-sheet label="X"><p>Inhalt</p></fl-sheet>');
    expect(getComputedStyle(body(el)).display).toBe('none');
    expect(grip(el).getAttribute('aria-expanded')).toBe('false');
  });

  it('wechselt per Tastatur am Griff die Hoehe und meldet change', async () => {
    const el = await mount<Sheet>('<fl-sheet label="X"></fl-sheet>');
    const seen: string[] = [];
    el.addEventListener('change', (event) => seen.push((event as CustomEvent<string>).detail));
    grip(el).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await el.updateComplete;
    grip(el).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await el.updateComplete;
    expect(seen).toEqual(['half', 'full']);
    expect(el.getAttribute('level')).toBe('full');
  });

  it('faellt bei ungueltiger Hoehe auf eingeklappt zurueck', async () => {
    const el = await mount<Sheet>('<fl-sheet level="riesig"></fl-sheet>');
    expect(el.level).toBe('peek');
  });

  it('haelt die Public Surface ein', async () => {
    const el = await mount<Sheet>('<fl-sheet></fl-sheet>');
    assertPublicSurface(el, ['sheet']);
  });
});
