import { afterEach, describe, expect, it } from 'vitest';
import { assertPublicSurface, expectAccessible, mount } from '../../internal/testing.js';
import './define.js';
import type { StepCard } from './step-card.js';

const card = (el: StepCard) => el.shadowRoot?.querySelector('button') as HTMLButtonElement;

afterEach(() => {
  document.body.replaceChildren();
});

describe('fl-step-card', () => {
  it('ist zugaenglich, auch mit Warnung', async () => {
    const el = await mount<StepCard>(
      '<fl-step-card index="06" kind="mountain" warning="W1">Entlang der Mitte</fl-step-card>',
    );
    await expectAccessible(el);
  });

  it('beschriftet Faltart und Winkel', async () => {
    const el = await mount<StepCard>(
      '<fl-step-card index="07" kind="mountain" angle="90">Flügel</fl-step-card>',
    );
    expect(card(el).textContent).toContain('Berg 90°');
  });

  it('zeigt kompakt nur die Faltart, der Titel bleibt lesbar', async () => {
    const el = await mount<StepCard>(
      '<fl-step-card index="02" kind="valley" angle="90" compact>Ecke</fl-step-card>',
    );
    expect(card(el).textContent).not.toContain('90°');
    expect(card(el).classList.contains('compact')).toBe(true);
    await expectAccessible(el);
  });

  it('markiert den aktiven Schritt mit aria-current', async () => {
    const el = await mount<StepCard>('<fl-step-card index="03" selected>Ecke</fl-step-card>');
    expect(card(el).getAttribute('aria-current')).toBe('step');
  });

  it('faellt bei ungueltiger Faltart auf Tal zurueck', async () => {
    const el = await mount<StepCard>('<fl-step-card kind="squash">X</fl-step-card>');
    expect(el.kind).toBe('valley');
  });

  it('haelt die Public Surface ein', async () => {
    const el = await mount<StepCard>('<fl-step-card>X</fl-step-card>');
    assertPublicSurface(el, ['control']);
  });
});
