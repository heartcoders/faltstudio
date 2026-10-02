import { css } from 'lit';
import { displayText, outlineIndex, t } from '@faltstudio/ui';

export const modePreviewStyles = css`
  :host {
    display: block;
    min-block-size: 0;
  }

  .layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr) auto;
    block-size: 100%;
    background-color: ${t('table')};
  }

  .stage {
    min-block-size: 0;
  }

  .step-caption {
    display: flex;
    align-items: flex-end;
    gap: ${t('space-4')};
    margin: 0;
    pointer-events: none;
  }

  .step-caption .step-index {
    ${outlineIndex}
    font-size: ${t('text-index-small')};
  }

  .step-caption .step-text {
    display: grid;
    gap: ${t('space-2')};
  }

  .step-caption .step-title {
    ${displayText}
    font-size: ${t('text-h1')};
    color: ${t('text')};
  }

  .camera {
    margin: 0;
    padding-block-start: ${t('space-2')};
    font-size: ${t('text-micro')};
    line-height: 1.7;
    letter-spacing: ${t('track-label')};
    text-transform: uppercase;
    color: ${t('text-label')};
  }

  .side {
    display: flex;
    flex-direction: column;
    min-block-size: 0;
    overflow-y: auto;
    border-inline-start: ${t('line-1')} solid ${t('border-frame')};
  }

  .step-info {
    display: grid;
    gap: ${t('space-3')};
    padding: ${t('space-4')};
  }

  .step-title {
    margin: 0;
    font-family: ${t('font-display')};
    font-size: 22px;
    color: ${t('text-highlight')};
  }

  .facts {
    display: grid;
    grid-template-columns: 74px 1fr;
    gap: ${t('space-1')};
    margin: 0;
    font-size: ${t('text-label-size')};
  }

  .facts dt {
    letter-spacing: ${t('track-label')};
    text-transform: uppercase;
    color: ${t('text-label')};
  }

  .facts dd {
    margin: 0;
    text-transform: uppercase;
  }

  .share {
    display: grid;
    gap: ${t('space-2')};
    margin-block-start: auto;
    padding: ${t('space-4')};
    border-block-start: ${t('line-1')} solid ${t('border-divider')};
  }

  .timeline {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: end;
    gap: ${t('space-6')};
    margin: 0 ${t('space-6')} ${t('space-4')};
    padding: ${t('space-4')} ${t('space-5')};
    background-color: ${t('card')};
    border: ${t('line-1')} solid ${t('card-edge')};
    box-shadow: ${t('card-shadow')};
  }

  .transport {
    display: grid;
    grid-template-columns: auto 88px auto;
    gap: ${t('space-3')};
  }

  .track {
    display: grid;
    gap: ${t('space-1')};
  }

  .titles {
    display: grid;
    grid-template-columns: repeat(var(--steps), 1fr);
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: ${t('text-micro')};
    color: ${t('text-label')};
  }

  .titles li {
    padding-inline: 6px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .titles b {
    display: block;
    font-size: ${t('text-label-size')};
  }

  .titles .reached {
    color: ${t('text-highlight')};
  }

  .tempo {
    display: grid;
    gap: ${t('space-1')};
  }

  /* Mobil: Umriss-Ziffer hinter der Szene, Titel auf dem Tisch, Karte unten. */
  .preview-index {
    position: absolute;
    inset-block-start: ${t('space-3')};
    inset-inline-start: -6px;
    font-size: ${t('text-index')};
    -webkit-text-stroke-color: ${t('border-divider')};
    pointer-events: none;
  }

  .preview-caption {
    position: absolute;
    z-index: 1;
    inset-inline: ${t('space-5')};
    inset-block-end: ${t('space-3')};
    display: grid;
    gap: ${t('space-2')};
    margin: 0;
    pointer-events: none;
  }

  .preview-caption .step-title {
    font-family: ${t('font-display')};
    font-size: 30px;
    font-weight: 500;
    line-height: 1.05;
    letter-spacing: -0.01em;
  }

  .mobile-timeline {
    display: grid;
    gap: ${t('space-3')};
    flex: none;
    margin: 0 ${t('space-3')} max(${t('space-3')}, env(safe-area-inset-bottom));
    padding: ${t('space-3')} ${t('space-4')};
    background-color: ${t('card')};
    border: ${t('line-1')} solid ${t('card-edge')};
    box-shadow: ${t('card-shadow')};
  }

  .position {
    justify-self: start;
    padding: 6px 10px;
    font-size: ${t('text-micro')};
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: ${t('text')};
    border: ${t('line-1')} solid ${t('border-control')};
  }

  .mobile-transport {
    display: grid;
    grid-template-columns: 48px minmax(0, 1fr) 48px 64px;
    gap: ${t('space-2')};
  }

  .mobile-transport .tap {
    min-block-size: 56px;
    padding-inline: 0;
  }

  .mobile-transport .tap.primary {
    padding-inline: 18px;
  }

  .tempo-tap {
    letter-spacing: 0;
  }
`;
