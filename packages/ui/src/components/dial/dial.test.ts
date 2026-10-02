import { afterEach, describe, expect, it } from 'vitest';
import { assertPublicSurface, expectAccessible, mount } from '../../internal/testing.js';
import './define.js';
import type { Dial } from './dial.js';

const surface = (el: Dial) => el.shadowRoot?.querySelector('svg') as SVGSVGElement;

function press(el: Dial, key: string, shiftKey = false): void {
  surface(el).dispatchEvent(new KeyboardEvent('keydown', { key, shiftKey, bubbles: true }));
}

afterEach(() => {
  document.body.replaceChildren();
});

describe('fl-dial', () => {
  it('ist zugaenglich', async () => {
    const el = await mount<Dial>('<fl-dial value="128"></fl-dial>');
    await expectAccessible(el);
  });

  it('klemmt Attributwerte auf 0 bis 180', async () => {
    const el = await mount<Dial>('<fl-dial value="400"></fl-dial>');
    expect(el.value).toBe(180);
  });

  it('aendert den Winkel per Pfeiltaste um 1 und mit Shift um 10 Grad', async () => {
    const el = await mount<Dial>('<fl-dial value="100"></fl-dial>');
    press(el, 'ArrowRight');
    expect(el.value).toBe(101);
    press(el, 'ArrowLeft', true);
    expect(el.value).toBe(91);
  });

  it('springt mit Home und End an die Enden', async () => {
    const el = await mount<Dial>('<fl-dial value="100"></fl-dial>');
    press(el, 'End');
    expect(el.value).toBe(180);
    press(el, 'Home');
    expect(el.value).toBe(0);
  });

  it('meldet change mit dem neuen Winkel', async () => {
    const el = await mount<Dial>('<fl-dial value="10"></fl-dial>');
    let reported = -1;
    el.addEventListener('change', (event) => (reported = (event as CustomEvent<number>).detail));
    press(el, 'PageUp');
    expect(reported).toBe(20);
  });

  it('haelt die Public Surface ein', async () => {
    const el = await mount<Dial>('<fl-dial></fl-dial>');
    assertPublicSurface(el, ['dial']);
  });
});
