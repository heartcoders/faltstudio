import { afterEach, describe, expect, it } from 'vitest';
import { assertPublicSurface, expectAccessible, mount } from '../../internal/testing.js';
import './define.js';
import type { Segmented } from './segmented.js';
import type { Segment } from './segment.js';

const MARKUP = `
  <fl-segmented label="Modus" value="lines">
    <fl-segment value="photo" index="01">Foto</fl-segment>
    <fl-segment value="lines" index="02">Linien</fl-segment>
    <fl-segment value="steps" index="03">Schritte</fl-segment>
  </fl-segmented>`;

const radio = (segment: Segment) =>
  segment.shadowRoot?.querySelector('button') as HTMLButtonElement;

const segments = (el: Segmented) => [...el.querySelectorAll<Segment>('fl-segment')];

async function settle(el: Segmented): Promise<void> {
  await el.updateComplete;
  await Promise.all(segments(el).map((segment) => segment.updateComplete));
}

afterEach(() => {
  document.body.replaceChildren();
});

describe('fl-segmented', () => {
  it('ist zugaenglich', async () => {
    const el = await mount<Segmented>(MARKUP);
    await settle(el);
    await expectAccessible(el);
  });

  it('markiert genau das Segment mit dem aktuellen Wert', async () => {
    const el = await mount<Segmented>(MARKUP);
    await settle(el);
    const checked = segments(el).map((segment) => radio(segment).getAttribute('aria-checked'));
    expect(checked).toEqual(['false', 'true', 'false']);
  });

  it('waehlt per Klick und meldet change', async () => {
    const el = await mount<Segmented>(MARKUP);
    await settle(el);
    let changed = '';
    el.addEventListener('change', (event) => (changed = (event as CustomEvent<string>).detail));
    radio(segments(el)[2] as Segment).click();
    await settle(el);
    expect(el.value).toBe('steps');
    expect(changed).toBe('steps');
  });

  it('wechselt mit Pfeiltasten und fokussiert das neue Segment', async () => {
    const el = await mount<Segmented>(MARKUP);
    await settle(el);
    const group = el.shadowRoot?.querySelector('[role="radiogroup"]') as HTMLElement;
    group.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    await settle(el);
    expect(el.value).toBe('photo');
  });

  it('haelt die Roving-Tabindex-Regel ein', async () => {
    const el = await mount<Segmented>(MARKUP);
    await settle(el);
    const tabindexes = segments(el).map((segment) => radio(segment).tabIndex);
    expect(tabindexes).toEqual([-1, 0, -1]);
  });

  it('haelt die Public Surface ein', async () => {
    const el = await mount<Segmented>(MARKUP);
    assertPublicSurface(el, ['group']);
  });
});
