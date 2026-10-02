import { afterEach, describe, expect, it } from 'vitest';
import { expectAccessible, mount } from '../../internal/testing.js';
import './define.js';
import '../checkbox/define.js';
import '../step-track/define.js';
import type { TextField } from './text-field.js';
import type { Checkbox } from '../checkbox/checkbox.js';
import type { StepTrack } from '../step-track/step-track.js';

afterEach(() => {
  document.body.replaceChildren();
});

describe('fl-text-field', () => {
  it('ist einzeilig und mehrzeilig zugaenglich', async () => {
    const single = await mount<TextField>(
      '<fl-text-field label="Titel" index="01"></fl-text-field>',
    );
    await expectAccessible(single);
    const multi = await mount<TextField>(
      '<fl-text-field label="Hinweis" multiline></fl-text-field>',
    );
    await expectAccessible(multi);
  });

  it('meldet Eingaben mit dem Wert', async () => {
    const el = await mount<TextField>('<fl-text-field label="Titel"></fl-text-field>');
    let reported = '';
    el.addEventListener('input', (event) => (reported = (event as CustomEvent<string>).detail));
    const field = el.shadowRoot?.querySelector('input') as HTMLInputElement;
    field.value = 'Linke Ecke';
    field.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    expect(reported).toBe('Linke Ecke');
  });
});

describe('fl-checkbox', () => {
  it('ist zugaenglich und meldet den neuen Zustand', async () => {
    const el = await mount<Checkbox>('<fl-checkbox>Ecken</fl-checkbox>');
    await expectAccessible(el);
    let reported: boolean | undefined;
    el.addEventListener('change', (event) => (reported = (event as CustomEvent<boolean>).detail));
    (el.shadowRoot?.querySelector('input') as HTMLInputElement).click();
    await el.updateComplete;
    expect(reported).toBe(true);
    expect(el.hasAttribute('checked')).toBe(true);
  });
});

describe('fl-step-track', () => {
  it('ist als Fortschrittsbalken zugaenglich', async () => {
    const el = await mount<StepTrack>('<fl-step-track steps="8" position="2.3"></fl-step-track>');
    await expectAccessible(el);
    const bar = el.shadowRoot?.querySelector('[role="progressbar"]');
    expect(bar?.getAttribute('aria-valuetext')).toBe('Schritt 3 von 8, 30 Prozent');
  });

  it('ist als Zeitleiste ziehbar und zugaenglich', async () => {
    const el = await mount<StepTrack>(
      '<fl-step-track steps="8" position="2.55" scrub label="Zeitleiste"></fl-step-track>',
    );
    await expectAccessible(el);
    expect(el.shadowRoot?.querySelector('input[type="range"]')).toBeTruthy();
  });

  it('markiert erreichte Schritte', async () => {
    const el = await mount<StepTrack>('<fl-step-track steps="8" position="2.3"></fl-step-track>');
    expect(el.shadowRoot?.querySelectorAll('.cell.reached').length).toBe(3);
  });
});
