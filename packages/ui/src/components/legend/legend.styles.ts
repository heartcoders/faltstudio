import { css } from 'lit';
import { t } from '../../internal/tokens.js';

export const legendStyles = css`
  .list {
    display: grid;
    gap: 2px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .entry {
    display: grid;
    grid-template-columns: 52px 1fr;
    align-items: center;
    gap: ${t('space-3')};
    min-block-size: 24px;
    font-size: ${t('text-micro')};
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: ${t('text-secondary')};
  }

  .entry.selected {
    color: ${t('text-highlight')};
  }

  .sample {
    inline-size: 52px;
    block-size: 12px;
    overflow: visible;
  }

  .line {
    stroke: ${t('gray-7')};
    stroke-width: 1.5;
  }

  .line.border {
    stroke: ${t('gray-8')};
  }

  .line.valley {
    stroke-dasharray: ${t('dash-valley')};
  }

  .line.mountain {
    stroke-dasharray: ${t('dash-mountain')};
  }

  .line.flat {
    stroke: ${t('gray-5')};
    stroke-width: 1;
    stroke-dasharray: ${t('dash-flat')};
  }

  .line.selected {
    stroke: ${t('gray-9')};
    stroke-width: 3;
  }

  .handle {
    fill: ${t('gray-0')};
    stroke: ${t('gray-9')};
    stroke-width: 1.5;
  }

  .snap {
    fill: none;
    stroke: ${t('gray-7')};
    stroke-width: 1;
  }
`;
