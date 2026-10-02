import { afterEach, describe, expect, it } from 'vitest';
import { assertPublicSurface, expectAccessible, mount } from '../../internal/testing.js';
import { getLocale, setLocale } from '../../i18n/locale.js';
import './define.js';
import type { LocaleSwitch } from './locale-switch.js';

const buttons = (el: LocaleSwitch) => [...(el.shadowRoot?.querySelectorAll('button') ?? [])];

afterEach(() => {
  setLocale('de');
  document.body.replaceChildren();
});

describe('fl-locale-switch', () => {
  it('ist zugaenglich', async () => {
    const el = await mount<LocaleSwitch>('<fl-locale-switch></fl-locale-switch>');
    await expectAccessible(el);
  });

  it('hat keine Public Surface', async () => {
    const el = await mount<LocaleSwitch>('<fl-locale-switch></fl-locale-switch>');
    assertPublicSurface(el, []);
  });

  it('wechselt die Sprache, setzt lang am Dokument und meldet change', async () => {
    setLocale('de');
    const el = await mount<LocaleSwitch>('<fl-locale-switch></fl-locale-switch>');
    let changed = '';
    el.addEventListener('change', (event) => (changed = (event as CustomEvent<string>).detail));
    buttons(el)[1]?.click();
    await el.updateComplete;
    expect(getLocale()).toBe('en');
    expect(document.documentElement.lang).toBe('en');
    expect(changed).toBe('en');
    expect(buttons(el).map((button) => button.getAttribute('aria-pressed'))).toEqual([
      'false',
      'true',
    ]);
  });
});
