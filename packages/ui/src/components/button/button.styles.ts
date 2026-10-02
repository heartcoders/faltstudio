import { css } from 'lit';
import { t, c } from '../../internal/tokens.js';
import { focusRing, labelText } from '../../internal/typography.js';

export const buttonStyles = css`
  .control {
    all: unset;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: ${t('space-3')};
    min-block-size: ${t('hit')};
    padding-inline: ${t('space-4')};
    font-family: ${t('font-mono')};
    ${labelText}
    font-weight: 600;
    cursor: pointer;
    user-select: none;
    border: ${t('line-1')} solid transparent;
    transition:
      background-color 100ms ease,
      border-color 100ms ease,
      color 100ms ease;
  }

  .control:focus-visible {
    ${focusRing}
  }

  .size-large {
    min-block-size: 48px;
  }

  .size-small {
    min-block-size: ${t('hit')};
    padding-inline: ${t('space-3')};
    font-size: ${t('text-micro')};
  }

  .square {
    inline-size: ${t('hit')};
    padding-inline: 0;
    font-size: ${t('text-lead')};
  }

  .trailing {
    justify-content: space-between;
  }

  .variant-auto,
  .variant-secondary {
    background-color: transparent;
    border-color: ${c('button-border', t('border-control'))};
    color: ${c('button-text', t('text'))};
  }

  .variant-auto:hover,
  .variant-secondary:hover,
  .variant-tertiary:hover {
    background-color: ${t('fill-hover')};
    border-color: ${t('border-strong')};
    color: ${t('text-highlight')};
  }

  .variant-primary,
  .variant-secondary[aria-pressed='true'],
  .variant-tertiary[aria-pressed='true'] {
    background-color: ${c('button-fill', t('fill-active'))};
    border-color: ${t('fill-active')};
    color: ${c('button-text', t('text-on-active'))};
    font-weight: 700;
  }

  .variant-primary:hover {
    background-color: ${t('gray-9')};
  }

  .variant-tertiary {
    background-color: transparent;
    color: ${c('button-text', t('text-secondary'))};
  }

  .tone-critical {
    border-style: dashed;
  }

  .control[disabled] {
    cursor: default;
    background-color: transparent;
    border: ${t('line-1')} dotted ${t('text-disabled')};
    color: ${t('text-disabled')};
  }

  @media (prefers-reduced-motion: reduce) {
    .control {
      transition: none;
    }
  }
`;
