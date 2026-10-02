import { css } from 'lit';
import { focusRing, t } from '@faltstudio/ui';

/**
 * Faecher der Papierblaetter (Design R1/D1). Jedes Blatt bekommt seinen
 * Abstand zur Auswahl (`--fan-shift`, mobil) bzw. zur Mitte (`--fan-spread`,
 * Desktop) als Zahl; Versatz, Neigung und Absenkung rechnet das CSS.
 */
export const sheetFanStyles = css`
  :host {
    --fan-sheet-inline: 150px;
    --fan-sheet-block: 212px;
    --fan-step: 94px;
    --fan-tilt: 8deg;
    --fan-drop: 9px;
    --fan-raise: -40px;
    --fan-origin: 50% 130%;
    --fan-floor: 40px;
  }

  .fan-area {
    position: relative;
    min-block-size: calc(var(--fan-sheet-block) + 2 * var(--fan-floor));
    touch-action: pan-y;
  }

  .fan {
    position: absolute;
    inset: 0;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .slot {
    position: absolute;
    z-index: var(--fan-z-mobile);
    inset-block-end: var(--fan-floor);
    inset-inline-start: calc(
      50% - var(--fan-sheet-inline) / 2 + var(--fan-shift) * var(--fan-step)
    );
    inline-size: var(--fan-sheet-inline);
    block-size: var(--fan-sheet-block);
    transform: translateY(calc(var(--fan-shift) * var(--fan-shift) * var(--fan-drop)))
      rotate(calc(var(--fan-shift) * var(--fan-tilt)));
    transform-origin: var(--fan-origin);
    transition:
      transform 0.4s ${t('ease')},
      inset-inline-start 0.4s ${t('ease')},
      opacity 0.3s;
  }

  .slot:has(.lifted) {
    transform: translateY(var(--fan-raise)) scale(1.06);
  }

  .slot:has(.far-mobile) {
    visibility: hidden;
    opacity: 0;
  }

  .sheet {
    all: unset;
    box-sizing: border-box;
    position: relative;
    display: block;
    inline-size: 100%;
    block-size: 100%;
    outline: 0 solid transparent;
    outline-offset: ${t('lift-offset')};
    cursor: pointer;
  }

  .sheet.paper {
    background-color: ${t('paper')};
    box-shadow: ${t('paper-shadow')};
  }

  .sheet.lifted {
    outline: ${t('lift-edge')} solid ${t('gray-9')};
  }

  .sheet:focus-visible {
    ${focusRing}
    outline-offset: ${t('lift-offset')};
  }

  .sheet fl-crease-canvas {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .sheet-number {
    position: absolute;
    inset-block-end: 5px;
    inset-inline-start: 7px;
    font-size: 9px;
    font-weight: 700;
    color: ${t('ink-strong')};
  }

  .sheet-error {
    position: absolute;
    inset-block-start: 6px;
    inset-inline-end: 6px;
    padding: 2px 5px;
    font-size: 9px;
    font-weight: 700;
    color: ${t('gray-9')};
    background-color: ${t('ink-strong')};
  }

  /* Mitgeliefertes Beispiel: kleine Marke oben links, umrandet statt gefuellt. */
  .sheet-example {
    position: absolute;
    inset-block-start: 6px;
    inset-inline-start: 6px;
    padding: 1px 5px;
    font-size: 8px;
    font-weight: 700;
    letter-spacing: ${t('track-label')};
    text-transform: uppercase;
    color: ${t('ink-strong')};
    background-color: ${t('paper')};
    border: ${t('line-1')} solid ${t('ink-strong')};
  }

  .blank,
  .first-sheet {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: ${t('space-2')};
    color: ${t('text')};
    background-color: ${t('table')};
    border: ${t('line-2')} dashed ${t('border-control')};
  }

  .blank.lifted {
    border-color: ${t('gray-9')};
  }

  .blank-plus {
    font-family: ${t('font-display')};
    font-size: 48px;
    font-weight: 300;
    line-height: 1;
  }

  .blank-label {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.18em;
    line-height: 1.6;
    text-align: center;
    text-transform: uppercase;
  }

  .ticks {
    display: flex;
    align-items: flex-end;
    block-size: 22px;
    margin: 0;
    padding: 0 ${t('space-5')};
    list-style: none;
  }

  .tick {
    display: flex;
    flex: 1;
    align-items: flex-end;
    block-size: 100%;
    border-block-end: ${t('line-1')} solid ${t('ink-soft')};
  }

  .tick::before {
    content: '';
    inline-size: 1px;
    block-size: 8px;
    background-color: ${t('gray-5')};
  }

  .tick.on::before {
    block-size: 100%;
    background-color: ${t('gray-9')};
  }

  @media (prefers-reduced-motion: reduce) {
    .slot {
      transition: none;
    }
  }

  @media (min-width: 48rem) {
    :host {
      --fan-sheet-inline: 186px;
      --fan-sheet-block: 263px;
      --fan-step: 164px;
      --fan-tilt: 5deg;
      --fan-drop: 6px;
      --fan-raise: -96px;
      --fan-origin: 50% 120%;
      --fan-floor: 64px;
    }

    /*
     * Faecherflaeche reicht bis unter das 3D-Modell; auf dem Desktop gibt es
     * kein Wischen, also nehmen nur die Blaetter selbst Zeiger an.
     */
    .fan-area {
      min-block-size: calc(var(--fan-sheet-block) + var(--fan-floor) + 96px);
      pointer-events: none;
    }

    .fan {
      pointer-events: none;
    }

    .sheet {
      pointer-events: auto;
    }

    .slot {
      z-index: var(--fan-z-desktop);
      inset-inline-start: calc(
        50% - var(--fan-sheet-inline) / 2 + var(--fan-spread) * var(--fan-step)
      );
      transform: translateY(calc(var(--fan-spread) * var(--fan-spread) * var(--fan-drop)))
        rotate(calc(var(--fan-spread) * var(--fan-tilt)));
    }

    .slot:has(.far-mobile) {
      visibility: visible;
      opacity: 1;
    }

    .slot:has(.far-desktop) {
      visibility: hidden;
      opacity: 0;
    }

    .sheet-number {
      inset-block-end: 6px;
      inset-inline-start: 8px;
      font-size: ${t('text-micro')};
    }

    .blank-plus {
      font-size: 56px;
    }

    .blank-label {
      font-size: ${t('text-micro')};
    }

    .ticks {
      display: none;
    }
  }
`;
