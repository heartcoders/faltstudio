import { css } from 'lit';
import { displayText, focusRing, outlineIndex, t } from '@faltstudio/ui';

export const modeStepsStyles = css`
  :host {
    display: block;
    min-block-size: 0;
  }

  /* Desktop: Blatt und 3D auf dem Tisch, Schritt-Karte rechts, Mini-Blaetter unten. */
  .layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 300px;
    grid-template-rows: minmax(0, 1fr) auto;
    block-size: 100%;
    background: ${t('table')};
  }

  .stage {
    display: grid;
    padding: ${t('space-6')};
  }

  .layout > .stage {
    position: relative;
    grid-template-rows: auto minmax(0, 1fr);
    gap: ${t('space-3')};
    min-block-size: 0;
  }

  .step-head {
    display: flex;
    align-items: flex-end;
    gap: ${t('space-4')};
    margin: 0;
  }

  .step-index {
    ${outlineIndex}
    font-size: ${t('text-index-small')};
  }

  .step-head-text {
    display: grid;
    gap: ${t('space-2')};
    min-inline-size: 0;
  }

  .step-head-title {
    ${displayText}
    font-size: ${t('text-h1')};
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .layout > .context {
    margin: ${t('space-6')} ${t('space-6')} ${t('space-4')} 0;
    background-color: ${t('card')};
    border: ${t('line-1')} solid ${t('card-edge')};
    box-shadow: ${t('paper-shadow')};
  }

  .layout .preview {
    border-inline-start: 0;
  }

  .layout .preview fl-scene {
    background: transparent;
  }

  .layout .playback {
    inset-inline: ${t('space-4')};
    inset-block-end: ${t('space-4')};
    padding: ${t('space-2')} ${t('space-3')} ${t('space-2')} ${t('space-2')};
    background-color: ${t('card')};
    border-color: ${t('card-edge')};
    box-shadow: ${t('paper-shadow')};
  }

  .layout .suggestion {
    background-color: ${t('card')};
    border-color: ${t('text')};
  }

  .layout > .cards {
    align-items: flex-end;
    gap: ${t('space-3')};
    min-block-size: 132px;
    padding: ${t('space-5')} ${t('space-6')} ${t('space-4')};
    border-block-start: 0;
  }

  .mini-sheet,
  .add-sheet {
    all: unset;
    box-sizing: border-box;
    position: relative;
    display: block;
    inline-size: 64px;
    block-size: 90px;
    cursor: pointer;
  }

  .mini-sheet {
    background-color: ${t('paper')};
    box-shadow: ${t('paper-shadow-small')};
    outline: 0 solid transparent;
    outline-offset: 4px;
    transition: transform 0.3s ${t('ease')};
  }

  .mini-sheet:hover {
    transform: translateY(-4px);
  }

  .mini-sheet.selected {
    transform: translateY(-10px) scale(1.1);
    outline: ${t('lift-edge')} solid ${t('text-highlight')};
  }

  .mini-sheet:focus-visible {
    ${focusRing}
  }

  .mini-sheet fl-crease-canvas {
    position: absolute;
    inset: 0;
  }

  .mini-number {
    position: absolute;
    inset-inline-start: 4px;
    inset-block-end: 2px;
    font-size: 8px;
    font-weight: 700;
    color: ${t('ink-strong')};
  }

  .mini-error {
    position: absolute;
    inset-inline-end: 2px;
    inset-block-start: 2px;
    padding: 0 3px;
    font-size: 8px;
    font-weight: 700;
    color: ${t('text-highlight')};
    background-color: ${t('ink-strong')};
  }

  .add-sheet {
    display: grid;
    place-items: center;
    inline-size: ${t('hit')};
    font-size: ${t('text-h2')};
    color: ${t('text')};
    border: ${t('line-1')} dashed ${t('border-control')};
  }

  .add-sheet:hover {
    border-color: ${t('text-highlight')};
  }

  .add-sheet:focus-visible {
    ${focusRing}
  }

  @media (prefers-reduced-motion: reduce) {
    .mini-sheet {
      transition: none;
    }
  }

  fl-crease-canvas {
    block-size: 100%;
  }

  .suggestion {
    display: flex;
    align-items: center;
    gap: ${t('space-3')};
    padding: ${t('space-1')} ${t('space-1')} ${t('space-1')} ${t('space-3')};
    background-color: ${t('fill')};
    border: ${t('line-1')} dashed ${t('gray-7')};
  }

  .suggestion p {
    margin: 0;
    font-size: 12px;
  }

  .preview {
    position: relative;
    min-block-size: 0;
    border-inline-start: ${t('line-1')} solid ${t('border-divider')};
  }

  .preview fl-scene {
    position: absolute;
    inset: 0;
    min-block-size: 0;
  }

  .playback {
    position: absolute;
    z-index: 1;
    inset-inline: ${t('space-2')};
    inset-block-end: ${t('space-2')};
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    gap: ${t('space-2')};
    padding: ${t('space-1')} ${t('space-2')} ${t('space-1')} ${t('space-1')};
    background-color: ${t('fill')};
    border: ${t('line-1')} solid ${t('border-divider')};
  }

  .title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .hint {
    margin: 0;
    font-size: ${t('text-micro')};
    line-height: 1.5;
    color: ${t('text-label')};
  }

  .chips,
  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: ${t('space-2')};
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .row fl-segmented {
    flex: 1;
  }

  fl-dial {
    display: block;
    max-inline-size: 180px;
    margin-inline: auto;
  }

  .cards {
    grid-column: 1 / -1;
    display: flex;
    gap: ${t('space-2')};
    margin: 0;
    padding: ${t('space-2')} ${t('space-4')};
    overflow-x: auto;
    list-style: none;
    border-block-start: ${t('line-1')} solid ${t('border-frame')};
  }

  .cards > li:last-child {
    display: grid;
  }

  /* Mobil (R6): Szene oben, Karte halb offen mit Faecher aus Mini-Blaettern. */
  .mobile > .stage {
    display: flex;
    flex-direction: column;
    gap: ${t('space-2')};
    padding: ${t('space-3')} ${t('space-4')};
  }

  .stage-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .view-switch {
    display: flex;
    gap: ${t('space-4')};
  }

  .view {
    position: relative;
    flex: 1;
    min-block-size: 0;
  }

  .view[hidden] {
    display: none;
  }

  .view fl-scene {
    position: absolute;
    inset: 0;
    min-block-size: 0;
  }

  .fan-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) ${t('hit')};
    gap: ${t('space-2')};
    align-items: center;
    block-size: 108px;
    padding-inline: ${t('space-3')};
  }

  .fan {
    display: flex;
    align-items: center;
    block-size: 100%;
    margin: 0;
    padding: 20px ${t('space-3')} 0 ${t('space-2')};
    overflow-x: auto;
    list-style: none;
    scrollbar-width: none;
  }

  .fan > li {
    flex: none;
    margin-inline-end: -16px;
  }

  .fan-sheet {
    all: unset;
    position: relative;
    display: block;
    box-sizing: border-box;
    inline-size: 54px;
    block-size: 76px;
    background-color: ${t('paper')};
    box-shadow: ${t('paper-shadow-small')};
    transform: rotate(calc(var(--offset, 0) * 2.5deg));
    transition: transform 0.3s ${t('ease')};
    cursor: pointer;
  }

  .fan-sheet.selected {
    z-index: 1;
    outline: ${t('lift-edge')} solid ${t('text-highlight')};
    outline-offset: 4px;
    transform: translateY(-10px) scale(1.12);
  }

  .fan-sheet:focus-visible {
    outline: ${t('line-2')} dashed ${t('border-focus')};
    outline-offset: 4px;
  }

  .fan-sheet fl-crease-canvas {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .fan-number {
    position: absolute;
    inset-block-end: 2px;
    inset-inline-start: 4px;
    font-size: 8px;
    font-weight: 700;
    color: ${t('ink-strong')};
  }

  .fan-error {
    position: absolute;
    inset-block-start: 2px;
    inset-inline-end: 2px;
    padding-inline: 3px;
    font-size: 8px;
    font-weight: 700;
    color: ${t('text-highlight')};
    background-color: ${t('ink-strong')};
  }

  .add-sheet {
    inline-size: ${t('hit')};
    block-size: 72px;
    padding: 0;
    font-size: 20px;
    font-weight: 400;
  }

  .sheet-line {
    display: grid;
    gap: ${t('space-2')};
    padding: ${t('space-2')} ${t('space-4')};
  }

  .title-line {
    grid-template-columns: minmax(0, 1fr) ${t('hit')};
    align-items: center;
  }

  .title-input {
    all: unset;
    box-sizing: border-box;
    min-inline-size: 0;
    block-size: ${t('hit')};
    overflow: hidden;
    font-family: ${t('font-display')};
    font-size: 22px;
    font-weight: 500;
    color: ${t('text')};
    white-space: nowrap;
    text-overflow: ellipsis;
    border-block-end: ${t('line-1')} solid transparent;
  }

  .title-input:focus-visible {
    border-block-end-color: ${t('border-control')};
  }

  .tap.square {
    inline-size: ${t('hit')};
    padding: 0;
    border-color: ${t('card-edge')};
  }

  .chip-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: ${t('space-2')};
  }

  .tap.chip {
    font-weight: 700;
    letter-spacing: 0;
    text-transform: none;
    color: ${t('text-on-active')};
    background-color: ${t('fill-active')};
    border-color: ${t('fill-active')};
  }

  .tap.chip.dashed {
    font-weight: 400;
    color: ${t('text')};
    background-color: transparent;
    border-color: ${t('border-strong')};
  }

  .dial-row {
    grid-template-columns: 160px minmax(0, 1fr);
    gap: ${t('space-3')};
    align-items: end;
  }

  .dial-row fl-dial {
    inline-size: 160px;
    max-inline-size: none;
    margin: 0;
  }

  .angle {
    display: grid;
    gap: ${t('space-2')};
  }

  .angle-value {
    font-family: ${t('font-display')};
    font-size: ${t('text-num')};
    font-weight: 300;
    line-height: 0.9;
    letter-spacing: -0.03em;
  }

  .playback-row {
    grid-template-columns: ${t('hit')} minmax(0, 1fr) 48px;
    gap: ${t('space-3')};
    align-items: center;
  }

  .tap.play {
    inline-size: ${t('hit')};
    padding: 0;
    color: ${t('text-on-active')};
    background-color: ${t('fill-active')};
    border-color: ${t('fill-active')};
  }

  .progress {
    font-size: ${t('text-micro')};
    text-align: end;
    color: ${t('text-secondary')};
  }

  .mobile fl-issue {
    display: block;
    margin: ${t('space-2')} ${t('space-4')};
  }
`;
