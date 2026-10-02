import { afterEach, describe, expect, it } from 'vitest';
import { assertPublicSurface, expectAccessible, mount } from '../../internal/testing.js';
import './define.js';
import type { Slider } from './slider.js';

const input = (el: Slider) => el.shadowRoot?.querySelector('input') as HTMLInputElement;

afterEach(() => {
  document.body.replaceChildren();
});

describe('fl-slider', () => {
  it('ist zugaenglich', async () => {
    const el = await mount<Slider>('<fl-slider label="Deckkraft" value="62" unit="%"></fl-slider>');
    await expectAccessible(el);
  });

  it('gibt den Wert mit Einheit als aria-valuetext aus', async () => {
    const el = await mount<Slider>('<fl-slider label="Deckkraft" value="62" unit="%"></fl-slider>');
    expect(input(el).getAttribute('aria-valuetext')).toBe('62 %');
  });

  it('uebernimmt Eingaben und meldet input mit dem Wert', async () => {
    const el = await mount<Slider>('<fl-slider label="Deckkraft"></fl-slider>');
    let reported = -1;
    el.addEventListener('input', (event) => (reported = (event as CustomEvent<number>).detail));
    input(el).value = '40';
    input(el).dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    expect(el.value).toBe(40);
    expect(reported).toBe(40);
  });

  it('meldet input genau einmal am Host', async () => {
    const el = await mount<Slider>('<fl-slider label="Deckkraft"></fl-slider>');
    let count = 0;
    el.addEventListener('input', () => count++);
    input(el).dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    expect(count).toBe(1);
  });

  it('faellt bei ungueltigem Attribut auf den Default zurueck', async () => {
    const el = await mount<Slider>('<fl-slider label="X" max="abc"></fl-slider>');
    expect(el.max).toBe(100);
  });

  it('haelt die Public Surface ein', async () => {
    const el = await mount<Slider>('<fl-slider label="X"></fl-slider>');
    assertPublicSurface(el, ['track']);
  });
});
