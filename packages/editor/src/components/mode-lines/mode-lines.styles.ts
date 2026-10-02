import { css } from 'lit';
import { t } from '@faltstudio/ui';

export const modeLinesStyles = css`
  :host {
    display: block;
    min-block-size: 0;
  }

  /* Desktop (D2): Werkzeugliste, Blatt und 3D liegen nebeneinander auf dem Tisch. */
  .layout {
    display: grid;
    grid-template-columns: 180px minmax(0, 1fr) minmax(0, 1fr);
    gap: ${t('space-6')};
    block-size: 100%;
    padding-inline-end: ${t('space-6')};
    background: ${t('table')};
  }

  .desk-sheet {
    display: grid;
    min-block-size: 0;
    padding-block: ${t('space-4')};
  }

  .desk-scene {
    position: relative;
    min-block-size: 0;
  }

  .desk-scene fl-scene {
    position: absolute;
    inset: 0 0 ${t('space-16')};
    min-block-size: 0;
    background: transparent;
  }

  .scene-label {
    position: absolute;
    inset-block-start: ${t('space-4')};
    inset-inline-start: ${t('space-5')};
    margin: 0;
    font-size: ${t('text-micro')};
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: ${t('text-label')};
    pointer-events: none;
  }

  .desk-issues {
    position: absolute;
    inset-inline: ${t('space-5')} 0;
    inset-block-end: ${t('space-6')};
  }

  fl-crease-canvas {
    block-size: 100%;
  }
`;
