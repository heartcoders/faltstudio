import { css } from 'lit';
import {
  displayText,
  microText,
  outlineIndex,
  t,
  visuallyHidden,
  watermarkText,
} from '@faltstudio/ui';
import { modelOverlayStyles } from './model-overlay.styles.js';
import { sheetFanStyles } from './sheet-fan.styles.js';
import { startControlsStyles } from './start-controls.styles.js';

/**
 * Startseite im Redesign „Tisch & Papier“ (R1, R2, D1). Mobil zuerst: eine
 * Bildschirmhoehe, Aktionen unten im Daumenbereich; ab 48 rem Aktionen neben
 * dem Titel und ein breiter Faecher.
 */
const pageStyles = css`
  :host {
    display: block;
    block-size: 100dvh;
  }

  .page {
    display: flex;
    flex-direction: column;
    block-size: 100%;
    overflow: clip;
    color: ${t('text')};
    background-color: ${t('table')};
  }

  .hidden {
    ${visuallyHidden}
  }

  .bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    min-block-size: ${t('hit')};
    padding: ${t('space-2')} ${t('space-5')} 0;
  }

  .brand-line {
    display: flex;
    flex: 1;
    justify-content: space-between;
    align-items: baseline;
    gap: ${t('space-3')};
    margin: 0;
  }

  .locale {
    flex: none;
    margin-inline: ${t('space-2')} calc(-1 * ${t('space-2')});
  }

  .brand {
    font-family: ${t('font-display')};
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.24em;
    text-transform: uppercase;
  }

  .model-count {
    ${microText}
    letter-spacing: 0.2em;
  }

  .desktop-only,
  .desktop-actions {
    display: none;
  }

  .notice {
    margin: ${t('space-2')} ${t('space-5')} 0;
    padding: ${t('space-3')};
    font-size: ${t('text-label-size')};
    border: ${t('line-1')} solid ${t('border-strong')};
  }

  /*
   * Eigener Stapelkontext: die Blaetter im Faecher tragen z-index bis 40 und
   * duerfen damit nie ueber Menue und Dialog liegen.
   */
  .overview {
    position: relative;
    isolation: isolate;
    display: grid;
    flex: 1;
    grid-template-rows: auto minmax(0, 1fr) auto;
    min-block-size: 0;
    overflow: clip;
    background: radial-gradient(ellipse 70% 60% at 50% 80%, ${t('table-glow')}, transparent);
  }

  .watermark {
    position: absolute;
    inset-block-end: 128px;
    inset-inline-start: 50%;
    inline-size: max-content;
    margin: 0;
    font-size: 150px;
    text-transform: uppercase;
    transform: translateX(-50%);
    ${watermarkText}
  }

  /* Das gewaehlte Modell gefaltet im Hintergrund: gross, gedaempft, ohne Zeiger. */
  .backdrop {
    position: absolute;
    inset-block-start: 0;
    inset-inline: 44% 0;
    block-size: 200px;
    opacity: 0.6;
  }

  .backdrop fl-model-turntable {
    block-size: 100%;
  }

  /*
   * Die Zeile ist breiter als ihr Text und liegt ueber dem 3D-Modell; nur ihre
   * Aktionen nehmen Zeiger an, damit man das Modell daneben ziehen kann.
   */
  .info {
    pointer-events: none;
    position: relative;
    display: grid;
    gap: ${t('space-4')};
    padding: ${t('space-3')} ${t('space-5')} 0 ${t('space-4')};
  }

  .info :is(a, button) {
    pointer-events: auto;
  }

  .index {
    margin: 0;
    font-size: ${t('text-index')};
    ${outlineIndex}
  }

  .index.dim {
    -webkit-text-stroke-color: ${t('gray-5')};
  }

  .info-text {
    display: flex;
    flex-direction: column;
    gap: ${t('space-2')};
    padding-inline-start: ${t('space-1')};
  }

  .kicker,
  .meta {
    margin: 0;
    text-transform: uppercase;
  }

  .kicker {
    ${microText}
    letter-spacing: 0.2em;
  }

  .current-title {
    margin: 0;
    ${displayText}
    font-size: ${t('text-title')};
  }

  .meta {
    font-size: ${t('text-label-size')};
    letter-spacing: 0.12em;
    color: ${t('text-secondary')};
  }

  .lead {
    max-inline-size: 300px;
    margin: 0;
    line-height: 1.5;
    color: ${t('text-secondary')};
  }

  .info-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: ${t('space-2')} ${t('space-5')};
    min-block-size: ${t('hit')};
  }

  .bottom-bar {
    display: grid;
    grid-template-columns: ${t('hit-primary')} 1fr 1.4fr;
    gap: ${t('space-2')};
    padding: ${t('space-3')} ${t('space-4')} max(28px, env(safe-area-inset-bottom));
  }

  .bottom-bar.two {
    grid-template-columns: 1fr 1.4fr;
  }

  .empty-table {
    position: relative;
    display: grid;
    place-items: center;
    min-block-size: 300px;
  }

  .ghost {
    position: absolute;
    inline-size: 120px;
    block-size: 170px;
    border: ${t('line-1')} dotted ${t('ink-soft')};
  }

  .ghost.left {
    inset-inline-start: 28px;
    transform: rotate(-9deg);
  }

  .ghost.right {
    inset-inline-end: 28px;
    transform: rotate(8deg);
  }

  .first-sheet {
    all: unset;
    box-sizing: border-box;
    z-index: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: ${t('space-3')};
    inline-size: 170px;
    block-size: 240px;
    color: ${t('text')};
    background-color: ${t('table')};
    border: ${t('line-2')} dashed ${t('gray-9')};
    outline: ${t('line-1')} solid ${t('gray-3')};
    outline-offset: ${t('space-2')};
    cursor: pointer;
  }

  .first-sheet .blank-plus {
    font-size: 64px;
  }

  .first-sheet .blank-label {
    font-size: ${t('text-micro')};
  }

  .first-sheet:focus-visible {
    outline: ${t('line-2')} dashed ${t('border-focus')};
  }

  .example-link {
    position: absolute;
    inset-block-end: 0;
    display: inline-flex;
    align-items: center;
    min-block-size: ${t('hit')};
    ${microText}
    letter-spacing: 0.18em;
    text-decoration: none;
  }

  .example-link:hover,
  .example-link:focus-visible {
    color: ${t('text-highlight')};
    text-decoration: underline;
  }
`;

const desktopStyles = css`
  @media (min-width: 48rem) {
    .mobile-only,
    .bottom-bar {
      display: none;
    }

    .bar {
      padding: ${t('space-6')} ${t('space-12')} 0;
    }

    .brand-line {
      flex: none;
      justify-content: flex-start;
    }

    .locale {
      margin-inline: auto ${t('space-5')};
    }

    .bar-actions {
      display: flex;
      align-items: center;
      gap: ${t('space-5')};
    }

    .plus.wide {
      block-size: ${t('hit')};
      padding-inline: ${t('space-4')};
      font-size: ${t('text-label-size')};
      font-weight: 700;
    }

    .watermark {
      inset-block-start: 290px;
      inset-block-end: auto;
      font-size: 232px;
    }

    .watermark .desktop-only {
      display: inline;
    }

    .backdrop {
      inset-block-start: 0;
      inset-inline: 48% 0;
      block-size: 64%;
      opacity: 0.7;
    }

    .info {
      display: flex;
      align-items: flex-start;
      gap: 36px;
      padding: ${t('space-8')} ${t('space-12')} 0;
    }

    .index {
      font-size: ${t('text-index-large')};
    }

    .info-text {
      gap: 10px;
      max-inline-size: 620px;
      padding-block-start: 6px;
    }

    .current-title {
      font-size: ${t('text-title-large')};
    }

    .meta {
      font-size: 12px;
    }

    .info-actions {
      margin-block-start: 14px;
    }

    .desktop-actions {
      display: flex;
      gap: ${t('space-2')};
    }

    .desktop-actions :is(.primary, .secondary) {
      block-size: 52px;
    }

    .empty-table {
      min-block-size: 360px;
    }

    .ghost.left {
      inset-inline-start: calc(50% - 300px);
    }

    .ghost.right {
      inset-inline-end: calc(50% - 300px);
    }
  }
`;

export const startPageStyles = [
  startControlsStyles,
  sheetFanStyles,
  modelOverlayStyles,
  pageStyles,
  desktopStyles,
];
