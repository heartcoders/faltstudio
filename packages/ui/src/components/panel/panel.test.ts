import { afterEach, describe, expect, it } from 'vitest';
import { assertPublicSurface, expectAccessible, mount } from '../../internal/testing.js';
import './define.js';
import '../readout/define.js';
import '../legend/define.js';
import type { Panel } from './panel.js';
import type { Readout } from '../readout/readout.js';
import type { Legend } from '../legend/legend.js';

afterEach(() => {
  document.body.replaceChildren();
});

describe('fl-panel', () => {
  it('ist zugaenglich und benennt die Section ueber die Ueberschrift', async () => {
    const el = await mount<Panel>(
      '<fl-panel letter="V" heading="Validierung" meta="2 Fehler">Inhalt</fl-panel>',
    );
    await expectAccessible(el);
    expect(el.shadowRoot?.querySelector('section')?.getAttribute('aria-labelledby')).toBe('title');
  });

  it('rendert die gewuenschte Ueberschriften-Ebene', async () => {
    const el = await mount<Panel>('<fl-panel heading="Lupe" level="3"></fl-panel>');
    expect(el.shadowRoot?.querySelector('h3')?.textContent).toBe('Lupe');
  });

  it('klemmt ungueltige Ebenen auf 2 bis 4', async () => {
    const el = await mount<Panel>('<fl-panel heading="X" level="9"></fl-panel>');
    expect(el.level).toBe(4);
  });

  it('haelt die Public Surface ein', async () => {
    const el = await mount<Panel>('<fl-panel heading="X"></fl-panel>');
    assertPublicSurface(el, ['panel', 'head']);
  });
});

describe('fl-readout', () => {
  it('ist zugaenglich und zeigt nur gesetzte Zeilen', async () => {
    const el = await mount<Readout>('<fl-readout primary="X 105.0 · Y 148.5 mm"></fl-readout>');
    await expectAccessible(el);
    expect(el.shadowRoot?.querySelectorAll('output > span').length).toBe(1);
  });
});

describe('fl-legend', () => {
  it('ist zugaenglich und listet alle sechs Linienarten', async () => {
    const el = await mount<Legend>('<fl-legend></fl-legend>');
    await expectAccessible(el);
    expect(el.shadowRoot?.querySelectorAll('li').length).toBe(6);
  });
});
