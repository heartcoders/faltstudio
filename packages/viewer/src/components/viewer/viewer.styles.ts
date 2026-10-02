import { css } from 'lit';
import { displayText, focusRing, microText, outlineIndex, t, visuallyHidden } from '@faltstudio/ui';

/**
 * Redesign „Tisch & Papier“ (R4): der Flieger liegt auf dem schwarzen Tisch,
 * die Bedienung als dunkle Karte darauf. Breit schwebt die Karte unten links
 * ueber der Szene, schmal (R4) liegt sie unter ihr am unteren Rand.
 */
export const viewerStyles = css`
  :host {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    block-size: 100dvh;
    container: viewer / inline-size;
    background-color: ${t('table')};
    color: ${t('text')};
  }

  :host([embedded]) {
    grid-template-rows: auto minmax(0, 1fr) auto;
    block-size: auto;
    aspect-ratio: 720 / 440;
    min-block-size: 360px;
  }

  p,
  h1 {
    margin: 0;
  }

  .sr {
    ${visuallyHidden}
  }

  .caption {
    ${microText}
  }

  .square {
    all: unset;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    inline-size: ${t('hit')};
    block-size: ${t('hit')};
    font-size: ${t('text-h2')};
    color: ${t('text')};
    cursor: pointer;
  }

  .square:hover {
    color: ${t('text-highlight')};
  }

  .square:focus-visible,
  .bar-link:focus-visible,
  .menu-item:focus-visible,
  .open-link:focus-visible {
    ${focusRing}
  }

  .bar {
    position: relative;
    z-index: 3;
    display: grid;
    grid-template-columns: ${t('hit')} minmax(0, 1fr) auto;
    gap: ${t('space-3')};
    align-items: center;
    block-size: 72px;
    padding-inline: ${t('space-3')} ${t('space-6')};
  }

  .bar-title {
    display: flex;
    align-items: baseline;
    gap: ${t('space-3')};
    min-inline-size: 0;
  }

  .brand {
    font-family: ${t('font-display')};
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.24em;
    text-transform: uppercase;
  }

  .kicker {
    overflow: hidden;
    ${microText}
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .bar-actions {
    position: relative;
    display: flex;
    align-items: center;
    gap: ${t('space-4')};
  }

  .bar-link {
    display: inline-flex;
    align-items: center;
    min-block-size: ${t('hit')};
    padding-inline: ${t('space-1')};
    font-size: ${t('text-label-size')};
    letter-spacing: ${t('track-label')};
    text-transform: uppercase;
    color: ${t('text')};
    text-decoration: none;
    box-shadow: inset 0 -1px 0 ${t('border-control')};
  }

  .bar-link:hover {
    color: ${t('text-highlight')};
  }

  .menu {
    position: absolute;
    inset-block-start: calc(100% + ${t('space-2')});
    inset-inline-end: 0;
    display: grid;
    min-inline-size: 220px;
    margin: 0;
    padding: ${t('space-2')} 0;
    list-style: none;
    background-color: ${t('card')};
    border: ${t('line-1')} solid ${t('card-edge')};
    box-shadow: ${t('paper-shadow')};
  }

  .menu-item {
    all: unset;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    inline-size: 100%;
    min-block-size: ${t('hit')};
    padding-inline: ${t('space-4')};
    font-size: ${t('text-label-size')};
    letter-spacing: ${t('track-label')};
    text-transform: uppercase;
    color: ${t('text')};
    text-decoration: none;
    cursor: pointer;
  }

  .menu-item:hover,
  .menu-item[aria-pressed='true'] {
    background-color: ${t('fill-active')};
    color: ${t('text-on-active')};
  }

  .menu-locale {
    margin-block-start: ${t('space-1')};
    padding-inline: ${t('space-3')};
    border-block-start: ${t('line-1')} solid ${t('border-divider')};
  }

  .embed-bar {
    grid-template-columns: minmax(0, 1fr) auto;
    block-size: 48px;
    padding-inline: ${t('space-3')} 0;
  }

  .embed-bar .bar-title {
    display: block;
    overflow: hidden;
    ${microText}
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .embed-bar b {
    color: ${t('text')};
  }

  .open-link {
    display: flex;
    align-items: center;
    align-self: stretch;
    padding-inline: ${t('space-4')};
    ${microText}
    color: ${t('text')};
    text-decoration: none;
  }

  .open-link:hover {
    color: ${t('text-highlight')};
  }

  .stage {
    position: relative;
    grid-row: 2;
    grid-column: 1;
    min-block-size: 0;
    background-color: ${t('table')};
  }

  .scene {
    position: absolute;
    inset: 0;
  }

  .index {
    position: absolute;
    z-index: 1;
    inset-block-start: ${t('space-6')};
    inset-inline-start: ${t('space-12')};
    ${outlineIndex}
    font-size: ${t('text-index-large')};
    -webkit-text-stroke-color: ${t('border-divider')};
    pointer-events: none;
    user-select: none;
  }

  .reading-aid {
    position: absolute;
    z-index: 2;
    inset-block-start: ${t('space-6')};
    inset-inline-end: ${t('space-6')};
    inline-size: 240px;
    background-color: ${t('card')};
  }

  .aid {
    display: grid;
    gap: ${t('space-1')};
    margin: 0;
    padding: ${t('space-2')} 0 0;
    list-style: none;
    font-size: ${t('text-micro')};
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: ${t('text-secondary')};
  }

  .aid li {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .aid-mark {
    inline-size: 16px;
    block-size: 12px;
  }

  .aid-mark.grip {
    inline-size: 14px;
    block-size: 14px;
    border: ${t('line-1')} solid ${t('gray-9')};
    border-radius: 50%;
  }

  .aid-mark.axis {
    background: linear-gradient(90deg, ${t('gray-9')} 50%, transparent 50%) 0 50% / 8px 2px repeat-x;
  }

  .aid-mark.ghost {
    border: ${t('line-1')} dashed ${t('gray-7')};
  }

  .aid-mark.path {
    background: linear-gradient(90deg, ${t('gray-7')} 1px, transparent 1px) 0 50% / 4px 1px repeat-x;
  }

  .embed-hint {
    position: absolute;
    z-index: 1;
    inset-block-start: ${t('space-3')};
    inset-inline-start: ${t('space-3')};
    padding: ${t('space-2')} ${t('space-3')};
    font-size: 12px;
    color: ${t('text-secondary')};
    background-color: ${t('card')};
    border: ${t('line-1')} solid ${t('card-edge')};
  }

  .embed-hint b {
    font-weight: 500;
    color: ${t('text')};
  }

  .dock {
    position: relative;
    z-index: 2;
    grid-row: 2;
    grid-column: 1;
    align-self: end;
    justify-self: start;
    display: grid;
    gap: ${t('space-5')};
    inline-size: min(440px, calc(100% - 2 * ${t('space-6')}));
    margin: ${t('space-6')};
    padding: ${t('space-5')};
    background-color: ${t('card')};
    border: ${t('line-1')} solid ${t('card-edge')};
    box-shadow: ${t('paper-shadow')};
  }

  .hint {
    display: grid;
    justify-items: start;
    gap: ${t('space-2')};
  }

  .state-chip {
    display: inline-flex;
    padding: 6px 10px;
    font-size: ${t('text-micro')};
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: ${t('text')};
    border: ${t('line-1')} solid ${t('border-control')};
  }

  .state-chip.settled {
    background-color: ${t('fill-active')};
    color: ${t('text-on-active')};
  }

  .step-title {
    ${displayText}
    font-size: ${t('text-h1')};
    line-height: 1.05;
    color: ${t('text-highlight')};
  }

  .step-text {
    font-size: ${t('text-body')};
    line-height: 1.5;
    color: ${t('text-secondary')};
  }

  /* Platz fuer drei Zeilen, damit die Karte beim Weiterblaettern nicht springt. */
  :host(:not([embedded])) .step-text {
    min-block-size: 3lh;
  }

  .enter {
    animation: step-enter 260ms ease-out both;
  }

  @keyframes step-enter {
    from {
      opacity: 0;
      transform: translateY(4px);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .enter {
      animation: none;
    }
  }

  .dock-controls {
    display: grid;
    gap: ${t('space-4')};
  }

  .ticks {
    display: flex;
    block-size: 20px;
    border-inline-end: ${t('line-1')} solid ${t('gray-5')};
  }

  .tick {
    position: relative;
    flex: 1;
    border-inline-start: ${t('line-1')} solid ${t('gray-5')};
  }

  .tick::before {
    content: '';
    position: absolute;
    inset-inline: 0;
    inset-block-end: 3px;
    block-size: 1px;
    background-color: ${t('border-divider')};
  }

  .tick-fill {
    position: absolute;
    inset-inline-start: 0;
    inset-block-end: 2px;
    block-size: 3px;
    background-color: ${t('gray-9')};
  }

  .controls {
    display: grid;
    grid-template-columns: ${t('hit-primary')} minmax(0, 1fr) ${t('hit-primary')};
    gap: ${t('space-2')};
  }

  .primary {
    display: grid;
  }

  .controls fl-button::part(control) {
    inline-size: 100%;
    min-block-size: ${t('hit-primary')};
  }

  .controls .primary fl-button::part(control) {
    padding-inline: 18px;
    font-size: 12px;
    font-weight: 700;
  }

  /* Weiter faltet auch vor dem Einrasten zu Ende, wirkt aber erst danach als Hauptaktion. */
  .next.pending::part(control) {
    border-style: dotted;
    border-color: ${t('text-disabled')};
    color: ${t('text-disabled')};
  }

  .next.pending:hover::part(control) {
    color: ${t('text')};
  }

  :host([embedded]) .dock {
    grid-row: 3;
    align-self: auto;
    justify-self: stretch;
    inline-size: auto;
    margin: 0;
    padding: ${t('space-2')} ${t('space-3')} ${t('space-3')};
    background-color: transparent;
    border: 0;
    box-shadow: none;
  }

  :host([embedded]) .dock-controls {
    gap: ${t('space-2')};
  }

  :host([embedded]) .controls {
    grid-template-columns: ${t('hit')} minmax(0, 1fr) ${t('hit')};
  }

  :host([embedded]) .controls fl-button::part(control) {
    min-block-size: ${t('hit')};
  }

  :host([embedded]) .index {
    display: none;
  }

  @container viewer (max-width: 47.99rem) {
    :host(:not([embedded])) {
      grid-template-rows: auto minmax(0, 1fr) auto;
    }

    :host(:not([embedded])) .bar {
      grid-template-columns: ${t('hit')} minmax(0, 1fr) ${t('hit')};
      gap: ${t('space-1')};
      block-size: 52px;
      padding-inline: ${t('space-2')};
    }

    :host(:not([embedded])) .bar-title {
      justify-content: center;
    }

    :host(:not([embedded])) .brand,
    :host(:not([embedded])) .bar-link {
      display: none;
    }

    :host(:not([embedded])) .index {
      inset-inline-start: -6px;
      inset-block-start: 0;
      font-size: ${t('text-index')};
    }

    :host(:not([embedded])) .reading-aid {
      inset-block-start: ${t('space-3')};
      inset-inline-end: ${t('space-3')};
    }

    :host(:not([embedded])) .dock {
      grid-row: 3;
      align-self: auto;
      justify-self: stretch;
      gap: ${t('space-4')};
      inline-size: auto;
      margin: 0;
      padding: ${t('space-3')} ${t('space-5')}
        calc(${t('space-3')} + env(safe-area-inset-bottom, 0px));
      background-color: transparent;
      border: 0;
      box-shadow: none;
    }

    :host(:not([embedded])) .hint .caption {
      ${visuallyHidden}
    }

    :host(:not([embedded])) .step-title {
      font-size: ${t('text-h1')};
    }

    :host(:not([embedded])) .step-text {
      min-block-size: 2lh;
    }
  }
`;
