import { afterEach, describe, expect, it } from 'vitest';
import { OPEN } from '../../config.js';
import {
  assertPublicSurface,
  captureWarnings,
  expectAccessible,
  mount,
} from '../../internal/testing.js';
import './define.js';
import type { Button } from './button.js';

const PARTS = ['control'];

const control = (el: Button) => el.shadowRoot?.querySelector('.control') as HTMLButtonElement;

afterEach(() => {
  document.body.replaceChildren();
});

describe('fl-button', () => {
  it('ist zugaenglich', async () => {
    const el = await mount<Button>('<fl-button>Speichern</fl-button>');
    await expectAccessible(el);
  });

  it('faellt bei ungueltigem Attributwert auf den Default zurueck', async () => {
    const el = await mount<Button>('<fl-button variant="unsinn">A</fl-button>');
    expect(el.variant).toBe('auto');
    expect(control(el).classList.contains('variant-auto')).toBe(true);
  });

  it('reflektiert eine per Property gesetzte Variante ins Attribut', async () => {
    const el = await mount<Button>('<fl-button>A</fl-button>');
    el.variant = 'primary';
    await el.updateComplete;
    expect(el.getAttribute('variant')).toBe('primary');
  });

  it('stellt bei removeAttribute den Default wieder her', async () => {
    const el = await mount<Button>('<fl-button variant="primary">A</fl-button>');
    el.removeAttribute('variant');
    await el.updateComplete;
    expect(el.variant).toBe('auto');
  });

  it('sendet ein Light-DOM-Formular ab', async () => {
    const form = await mount<HTMLFormElement>(
      '<form><fl-button type="submit">Absenden</fl-button></form>',
    );
    let submitted = false;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      submitted = true;
    });
    const button = form.querySelector('fl-button');
    await button?.updateComplete;
    button?.click();
    expect(submitted).toBe(true);
  });

  it('schluckt Klicks im disabled-Zustand', async () => {
    const el = await mount<Button>('<fl-button disabled>A</fl-button>');
    let clicks = 0;
    el.addEventListener('click', () => clicks++);
    el.click();
    control(el).click();
    expect(clicks).toBe(0);
  });

  it('spiegelt pressed als aria-pressed', async () => {
    const el = await mount<Button>('<fl-button pressed="true">Linien</fl-button>');
    expect(control(el).getAttribute('aria-pressed')).toBe('true');
  });

  it('warnt bei einem per JS gesetzten ungueltigen Enum-Wert', async () => {
    const el = await mount<Button>('<fl-button>A</fl-button>');
    const warnings = await captureWarnings(async () => {
      (el as unknown as { variant: string }).variant = 'unsinn';
      await el.updateComplete;
    });
    expect(warnings.some((warning) => warning.includes('variant="unsinn"'))).toBe(true);
  });

  it('haelt die Public Surface ein', async () => {
    const el = await mount<Button>('<fl-button>A</fl-button>');
    assertPublicSurface(el, PARTS);
    expect(OPEN || !control(el).hasAttribute('part')).toBe(true);
  });
});
