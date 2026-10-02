import { afterEach, describe, expect, it } from 'vitest';
import { assertPublicSurface, expectAccessible, mount } from '../../internal/testing.js';
import { setLocale } from '../../i18n/locale.js';
import './define.js';
import type { Issue } from './issue.js';

const text = (el: Issue) => el.shadowRoot?.querySelector('.body')?.textContent ?? '';

afterEach(() => {
  setLocale('de');
  document.body.replaceChildren();
});

describe('fl-issue', () => {
  it('ist in allen drei Schweregraden zugaenglich', async () => {
    for (const severity of ['error', 'warning', 'ok']) {
      const el = await mount<Issue>(
        `<fl-issue severity="${severity}" code="E1" heading="Kawasaki · K3">Winkelsumme</fl-issue>`,
      );
      await expectAccessible(el);
    }
  });

  it('nennt die Schwere als Text, nicht nur ueber die Form der Marke', async () => {
    const el = await mount<Issue>('<fl-issue severity="error" code="E1">X</fl-issue>');
    expect(text(el)).toContain('Fehler E1');
  });

  it('nennt die Schwere auf Englisch und wechselt ohne neues Element', async () => {
    const el = await mount<Issue>('<fl-issue severity="warning" code="W2">X</fl-issue>');
    setLocale('en');
    await el.updateComplete;
    expect(text(el)).toContain('Warning W2');
  });

  it('faellt bei ungueltiger Schwere auf Warnung zurueck', async () => {
    const el = await mount<Issue>('<fl-issue severity="fatal">X</fl-issue>');
    expect(el.severity).toBe('warning');
  });

  it('haelt die Public Surface ein', async () => {
    const el = await mount<Issue>('<fl-issue>X</fl-issue>');
    assertPublicSurface(el, ['row']);
  });
});
