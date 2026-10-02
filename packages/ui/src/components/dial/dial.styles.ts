import { css } from 'lit';
import { t } from '../../internal/tokens.js';
import { focusRing } from '../../internal/typography.js';

export const dialStyles = css`
  .dial {
    display: block;
    inline-size: 100%;
    max-inline-size: 280px;
    overflow: visible;
    touch-action: none;
    cursor: grab;
  }

  .dial:active {
    cursor: grabbing;
  }

  .dial:focus {
    outline: none;
  }

  .dial:focus-visible {
    ${focusRing}
  }

  .dial[aria-disabled='true'] {
    opacity: 0.4;
    cursor: default;
  }

  .arc,
  .base {
    fill: none;
    stroke: ${t('gray-5')};
    stroke-width: 1;
  }

  .tick {
    stroke: ${t('gray-6')};
    stroke-width: 1;
  }

  .tick.major {
    stroke: ${t('gray-8')};
  }

  .tick-label {
    fill: ${t('text-label')};
    font-family: ${t('font-mono')};
    font-size: 9px;
    text-anchor: middle;
  }

  .snap {
    fill: none;
    stroke: ${t('gray-6')};
  }

  .progress {
    fill: none;
    stroke: ${t('gray-9')};
    stroke-width: 3;
  }

  .needle {
    stroke: ${t('gray-9')};
    stroke-width: 2;
  }

  .knob {
    fill: ${t('gray-0')};
    stroke: ${t('gray-9')};
    stroke-width: 1.5;
  }

  .hub {
    fill: ${t('gray-9')};
  }
`;
