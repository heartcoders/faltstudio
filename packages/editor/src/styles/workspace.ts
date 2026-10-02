import { css } from 'lit';
import { t } from '@faltstudio/ui';

/**
 * Gemeinsame Bausteine der Modus-Ansichten: der schwarze Tisch (Redesign
 * „Tisch & Papier“, ohne Raster, das liegt nur noch auf dem Papier) und
 * Overlays in den Ecken.
 */
export const workspaceStyles = css`
  .table-surface {
    position: relative;
    min-block-size: 0;
    background:
      radial-gradient(ellipse 70% 60% at 50% 70%, ${t('table-glow')}, transparent), ${t('table')};
  }

  /* Bedien-Karte: dunkle Karte, die am unteren Rand auf dem Tisch liegt. */
  .control-card {
    background-color: ${t('card')};
    border: ${t('line-1')} solid ${t('card-edge')};
    box-shadow: ${t('card-shadow')};
  }

  .overlay {
    position: absolute;
    z-index: 1;
  }

  .overlay.top-left {
    inset-block-start: ${t('space-6')};
    inset-inline-start: ${t('space-6')};
  }

  .overlay.top-right {
    inset-block-start: ${t('space-3')};
    inset-inline-end: ${t('space-3')};
  }

  .overlay.bottom-right {
    inset-block-end: ${t('space-4')};
    inset-inline-end: ${t('space-4')};
  }

  .overlay.bottom-left {
    inset-block-end: ${t('space-4')};
    inset-inline-start: ${t('space-4')};
  }

  .overlay.bottom {
    inset-block-end: ${t('space-3')};
    inset-inline: ${t('space-3')};
  }

  .fill-scene {
    position: absolute;
    inset: 0;
  }

  .caption {
    margin: 0;
    font-size: ${t('text-micro')};
    letter-spacing: ${t('track-label')};
    text-transform: uppercase;
    color: ${t('text-label')};
  }

  .section-label {
    margin: 0;
    padding: ${t('space-3')} ${t('space-3')} ${t('space-2')};
    font-size: ${t('text-micro')};
    font-weight: 400;
    letter-spacing: ${t('track-label')};
    text-transform: uppercase;
    color: ${t('text-label')};
    border-block-start: ${t('line-1')} solid ${t('border-divider')};
  }

  /* Kontext-Panel rechts: eine Spalte, Abschnitte statt Kaesten. */
  .context {
    display: flex;
    flex-direction: column;
    gap: ${t('space-5')};
    min-block-size: 0;
    padding: ${t('space-4')};
    overflow-y: auto;
    background-color: ${t('fill')};
    border-inline-start: ${t('line-1')} solid ${t('border-frame')};
  }

  .context > section {
    display: grid;
    gap: ${t('space-2')};
  }

  .context h2 {
    margin: 0;
    font-size: ${t('text-micro')};
    font-weight: 400;
    letter-spacing: ${t('track-label')};
    text-transform: uppercase;
    color: ${t('text-label')};
  }

  /* 3D als kleine Vorschau in der Ecke der Arbeitsflaeche; per Knopf gross. */
  .mini {
    position: absolute;
    z-index: 2;
    inset-block-end: ${t('space-4')};
    inset-inline-end: ${t('space-4')};
    inline-size: min(300px, 40%);
    aspect-ratio: 4 / 3;
    background-color: ${t('fill')};
    border: ${t('line-1')} solid ${t('border-frame')};
  }

  .mini.large {
    inset: 0;
    inline-size: auto;
    aspect-ratio: auto;
    border: 0;
  }

  .mini fl-scene {
    position: absolute;
    inset: 0;
    min-block-size: 0;
  }

  .mini-toggle {
    position: absolute;
    z-index: 1;
    inset-block-start: ${t('space-1')};
    inset-inline-end: ${t('space-1')};
  }

  .issue-list {
    margin: 0;
    padding: 0;
    list-style: none;
  }
`;
