import { css } from 'lit';
import { displayText, focusRing, labelText, microText, outlineIndex, t } from '@faltstudio/ui';

/**
 * Gemeinsame Bausteine der mobilen Modus-Ansichten (Redesign „Tisch & Papier“):
 * schwarzer Tisch mit dem Papier oben, Bedienung als dunkle Karte unten im
 * Daumenbereich.
 */
export const mobileStyles = css`
  .mobile {
    display: flex;
    flex-direction: column;
    block-size: 100%;
    min-block-size: 0;
    background-color: ${t('table')};
  }

  .mobile > .stage {
    position: relative;
    flex: 1;
    min-block-size: 0;
    padding: ${t('space-2')};
  }

  .mobile fl-sheet {
    flex: none;
  }

  .tap {
    all: unset;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: ${t('space-2')};
    min-block-size: ${t('hit')};
    padding-inline: ${t('space-3')};
    ${labelText}
    font-weight: 600;
    color: ${t('text')};
    border: ${t('line-1')} solid ${t('border-control')};
    background-color: transparent;
    cursor: pointer;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
  }

  .tap:focus-visible {
    ${focusRing}
    outline-offset: -3px;
  }

  .tap[aria-pressed='true'],
  .tap.primary {
    background-color: ${t('fill-active')};
    color: ${t('text-on-active')};
    border-color: ${t('fill-active')};
  }

  /* Primaeraktion: volle Breite, 56 px, Text links, Pfeil rechts. */
  .tap.primary {
    justify-content: space-between;
    min-block-size: ${t('hit-primary')};
    padding-inline: 18px;
    font-size: 12px;
    font-weight: 700;
  }

  /* Textaktion: unterstrichen statt umrandet. */
  .text-action {
    all: unset;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    align-self: flex-start;
    min-block-size: ${t('hit')};
    padding-inline: ${t('space-1')};
    ${microText}
    color: ${t('text')};
    border-block-end: ${t('line-1')} solid ${t('border-control')};
    cursor: pointer;
  }

  .text-action.strong {
    font-weight: 700;
    color: ${t('text-highlight')};
    border-block-end: 2px solid ${t('text-highlight')};
  }

  .text-action:focus-visible {
    ${focusRing}
  }

  .card-title {
    margin: 0;
    ${displayText}
    font-size: 22px;
  }

  .index {
    margin: 0;
    ${outlineIndex}
    font-size: ${t('text-index-small')};
  }

  .tap.dashed {
    border-style: dashed;
  }

  .tap:disabled,
  .tap.primary:disabled {
    color: ${t('text-disabled')};
    background-color: transparent;
    border-color: ${t('border-divider')};
    border-style: dotted;
    cursor: default;
  }

  .field-label {
    display: flex;
    justify-content: space-between;
    margin: 0;
    ${microText}
  }

  /* Werkzeugleiste (R5): dunkle Karte mit fuenf Zellen ueber dem Tisch. */
  .toolbar {
    display: grid;
    grid-auto-columns: minmax(0, 1fr);
    grid-auto-flow: column;
    flex: none;
    block-size: 68px;
    margin: 0 ${t('space-3')} max(${t('space-3')}, env(safe-area-inset-bottom));
    background-color: ${t('card')};
    border: ${t('line-1')} solid ${t('card-edge')};
    box-shadow: ${t('card-shadow')};
  }

  .toolbar .tap {
    flex-direction: column;
    gap: 6px;
    block-size: 100%;
    padding: 0;
    font-size: ${t('text-micro')};
    letter-spacing: 0.08em;
    font-weight: 400;
    color: ${t('text-secondary')};
    border: 0;
  }

  .toolbar .tap[aria-pressed='true'] {
    font-weight: 700;
    color: ${t('text-on-active')};
  }

  .toolbar .tap.setting {
    font-weight: 700;
    color: ${t('text')};
    border-inline-start: ${t('line-1')} solid ${t('border-divider')};
  }

  .badge {
    padding: 1px 5px;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0;
    color: ${t('text-on-active')};
    background-color: ${t('fill-active')};
  }

  .badge.off {
    color: ${t('text-label')};
    background-color: transparent;
    outline: ${t('line-1')} solid ${t('border-frame')};
  }

  .glyph {
    font-size: 15px;
    line-height: 1;
  }

  .sample {
    display: block;
  }

  .sample-line {
    stroke: currentColor;
    stroke-width: 1.25;
  }

  .sample-line.valley {
    stroke-dasharray: ${t('dash-valley')};
  }

  .sample-line.mountain {
    stroke-dasharray: ${t('dash-mountain')};
  }

  .sample-line.flat {
    stroke-dasharray: ${t('dash-flat')};
  }

  /* Kontextleiste (C13): erscheint nur bei Auswahl, ueber der Werkzeugleiste. */
  .context-bar {
    display: grid;
    grid-template-columns: 1.1fr 1fr 1fr;
    gap: ${t('space-2')};
    flex: none;
    padding: ${t('space-2')} ${t('space-3')};
    background-color: ${t('card')};
  }

  .context-bar .tap {
    padding-inline: ${t('space-2')};
    white-space: nowrap;
  }

  .zoom-reset {
    position: absolute;
    z-index: 2;
    inset-block-end: ${t('space-3')};
    inset-inline-end: ${t('space-3')};
    background-color: ${t('card')};
    border-color: ${t('card-edge')};
  }

  .tap.critical {
    background-color: ${t('fill-active')};
    color: ${t('text-on-active')};
  }

  /* Kopfzeile im Sheet: Titel, Zusammenfassung, Pfeil. */
  .sheet-row {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    gap: ${t('space-3')};
    min-block-size: 44px;
    padding-inline: ${t('space-3')};
  }

  .sheet-title {
    margin: 0;
    ${labelText}
    font-weight: 600;
    white-space: nowrap;
  }

  .sheet-summary {
    overflow: hidden;
    ${microText}
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .rows {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .rows > li {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: ${t('space-3')};
    min-block-size: 48px;
    padding-inline: ${t('space-3')};
    border-block-start: ${t('line-1')} solid ${t('border-divider')};
  }

  .rows .note {
    ${microText}
  }

  .legend {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: ${t('space-2')} ${t('space-4')};
    margin: 0;
    padding: ${t('space-3')};
    list-style: none;
    border-block-start: ${t('line-1')} solid ${t('border-divider')};
  }

  .legend li {
    display: flex;
    align-items: center;
    gap: ${t('space-3')};
    ${microText}
    color: ${t('text-secondary')};
  }

  /* Hinweisbox oben links, Eckmarken wie im Blueprint. */
  .hint-box {
    position: absolute;
    z-index: 2;
    inset-block-start: ${t('space-3')};
    inset-inline-start: ${t('space-3')};
    max-inline-size: 60%;
    margin: 0;
    padding: ${t('space-2')} ${t('space-3')};
    ${microText}
    line-height: 1.6;
    color: ${t('text-secondary')};
    background-color: ${t('card')};
    border: ${t('line-1')} solid ${t('card-edge')};
  }

  .hint-box b {
    display: block;
    font-weight: 700;
    color: ${t('text')};
  }

  /* Rueckgaengig / Wiederholen: zwei Quadrate links unten auf dem Tisch. */
  .history {
    position: absolute;
    z-index: 2;
    inset-block-end: ${t('space-3')};
    inset-inline-start: 14px;
    display: flex;
    gap: 6px;
  }

  .history .tap {
    inline-size: ${t('hit')};
    padding: 0;
    font-size: 16px;
    background-color: ${t('card')};
    border-color: ${t('card-edge')};
  }

  .history .tap:disabled {
    border-style: solid;
  }

  /* 3D-Kachel oben rechts (96 x 72); Tippen zeigt sie gross. */
  .tile {
    position: absolute;
    z-index: 2;
    inset-block-start: 14px;
    inset-inline-end: 14px;
    inline-size: 96px;
    block-size: 72px;
    overflow: hidden;
    background-color: ${t('card')};
    border: ${t('line-1')} solid ${t('card-edge')};
  }

  .tile.large {
    inset: 0;
    inline-size: auto;
    block-size: auto;
    border: 0;
  }

  .tile fl-scene {
    position: absolute;
    inset: 0;
    min-block-size: 0;
  }

  .tile .tile-toggle {
    position: absolute;
    z-index: 1;
    inset: 0;
    align-items: flex-start;
    justify-content: flex-start;
    padding: ${t('space-1')} 6px;
    font-size: 9px;
    font-weight: 400;
    color: ${t('text')};
    border: 0;
  }

  .tile.large .tile-toggle {
    inset: ${t('space-3')} auto auto ${t('space-3')};
    align-items: center;
    padding-inline: ${t('space-3')};
    background-color: ${t('card')};
    border: ${t('line-1')} solid ${t('card-edge')};
  }
`;
