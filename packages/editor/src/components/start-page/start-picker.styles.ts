import { css } from 'lit';
import { displayText, focusRing, microText, t, visuallyHidden } from '@faltstudio/ui';
import { startControlsStyles } from './start-controls.styles.js';

/** Neues Modell (Design R3): Papierkarten auf dem Tisch, Aktion fest unten. */
export const startPickerStyles = [
  startControlsStyles,
  css`
    :host {
      --option-art: 110px;
      --option-height: 150px;

      display: grid;
      grid-template-rows: auto minmax(0, 1fr) auto;
      block-size: 100dvh;
      background-color: ${t('table')};
      color: ${t('text')};
    }

    .head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: ${t('space-1')} ${t('space-5')} 0 ${t('space-2')};
    }

    .back {
      all: unset;
      display: grid;
      place-items: center;
      inline-size: ${t('hit')};
      block-size: ${t('hit')};
      font-size: ${t('text-h2')};
      cursor: pointer;
    }

    .back:focus-visible {
      ${focusRing}
    }

    .head-label {
      margin: 0;
      ${microText}
      letter-spacing: 0.2em;
    }

    .body {
      display: flex;
      flex-direction: column;
      gap: ${t('space-6')};
      inline-size: min(100%, 560px);
      margin-inline: auto;
      padding: ${t('space-4')} ${t('space-6')};
      overflow-y: auto;
    }

    .title {
      margin: 0;
      ${displayText}
      font-size: 40px;
    }

    .options {
      display: grid;
      gap: ${t('space-3')};
      margin: 0;
      padding: 0;
      border: 0;
    }

    .hidden {
      ${visuallyHidden}
    }

    .option {
      position: relative;
      display: grid;
      grid-template-columns: var(--option-art) minmax(0, 1fr);
      min-block-size: var(--option-height);
      color: ${t('ink-strong')};
      background-color: ${t('paper')};
      box-shadow: ${t('paper-shadow')};
      outline: 0 solid transparent;
      outline-offset: ${t('lift-offset')};
      cursor: pointer;
      transition: transform 0.35s ${t('ease')};
    }

    .option:nth-of-type(1) {
      transform: rotate(-2deg) translateX(-6px);
    }

    .option:nth-of-type(2) {
      transform: rotate(1.5deg) translateX(6px);
    }

    .option:nth-of-type(3) {
      transform: rotate(-1deg) translateX(-4px);
    }

    .option.chosen {
      z-index: 1;
      transform: scale(1.02);
      outline: ${t('lift-edge')} solid ${t('gray-9')};
    }

    .option:has(:focus-visible) {
      ${focusRing}
    }

    .option:has(:disabled) {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .radio {
      ${visuallyHidden}
    }

    .art-frame {
      display: grid;
      padding: 14px;
      border-inline-end: ${t('line-1')} solid ${t('border-control')};
    }

    .art {
      inline-size: 100%;
      block-size: 100%;
    }

    .art-blank {
      fill: none;
      stroke: ${t('gray-5')};
      stroke-dasharray: ${t('dash-ghost')};
    }

    .art-photo {
      fill: ${t('gray-3')};
    }

    .art-photo-line {
      stroke: ${t('gray-4')};
      stroke-width: 7;
    }

    .art-label {
      fill: ${t('text')};
      font-family: ${t('font-mono')};
      font-size: 9px;
      letter-spacing: 1px;
      text-anchor: middle;
    }

    .option-body {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: ${t('space-4')};
    }

    .option-number {
      font-size: ${t('text-micro')};
      font-weight: 700;
      letter-spacing: 0.18em;
    }

    .option-title {
      font-family: ${t('font-display')};
      font-size: 24px;
      font-weight: 600;
      line-height: 1.05;
    }

    .option-text {
      font-size: ${t('text-label-size')};
      line-height: ${t('line-height')};
      color: ${t('ink')};
    }

    .formats {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      align-items: center;
      gap: 0 ${t('space-4')};
      margin: 0;
      padding: 0;
      border: 0;
      ${microText}
    }

    .formats-label {
      float: inline-start;
      margin-inline-end: auto;
      padding: 0;
    }

    .format {
      display: inline-flex;
      align-items: center;
      min-block-size: ${t('hit')};
      border-block-end: 2px solid transparent;
      cursor: pointer;
    }

    .format.on {
      font-weight: 700;
      color: ${t('text-highlight')};
      border-block-end-color: ${t('text-highlight')};
    }

    .format:has(:disabled) {
      color: ${t('text-disabled')};
      cursor: not-allowed;
    }

    .format:has(:focus-visible) {
      ${focusRing}
    }

    .foot {
      display: grid;
      inline-size: min(100%, 560px);
      margin-inline: auto;
      padding: ${t('space-3')} ${t('space-4')} 28px;
    }

    @media (prefers-reduced-motion: reduce) {
      .option {
        transition: none;
      }
    }

    @media (min-width: 48rem) {
      :host {
        --option-art: 120px;
        --option-height: 150px;
      }

      .head {
        padding: ${t('space-6')} ${t('space-12')} 0 ${t('space-8')};
      }

      .title {
        font-size: ${t('text-title-large')};
      }

      .option-title {
        font-size: 28px;
      }
    }
  `,
];
