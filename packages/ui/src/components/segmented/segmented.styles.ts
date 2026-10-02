import { css } from 'lit';
import { t } from '../../internal/tokens.js';
import { focusRing } from '../../internal/typography.js';

export const segmentedStyles = css`
  .group {
    display: inline-grid;
    grid-auto-flow: column;
    grid-auto-columns: auto;
    border: ${t('line-1')} solid ${t('border-control')};
  }

  .group.fill {
    display: grid;
    grid-auto-columns: 1fr;
  }

  .group.vertical {
    display: grid;
    grid-auto-flow: row;
  }

  .group.bare {
    border: 0;
  }
`;

export const segmentStyles = css`
  .control {
    all: unset;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    min-block-size: ${t('hit')};
    min-inline-size: ${t('hit')};
    padding-inline: ${t('space-4')};
    font-family: ${t('font-mono')};
    font-size: 12px;
    font-weight: 500;
    letter-spacing: ${t('track-label')};
    text-transform: uppercase;
    color: ${t('text-secondary')};
    cursor: pointer;
    border-inline-start: ${t('line-1')} solid ${t('border-frame')};
  }

  :host(:first-child) .control {
    border-inline-start: 0;
  }

  .control:hover {
    background-color: ${t('fill-hover')};
    color: ${t('text-highlight')};
  }

  .control:focus-visible {
    ${focusRing}
    outline-offset: -4px;
  }

  .control[aria-checked='true'] {
    background-color: ${t('fill-active')};
    border-inline-start-color: ${t('border-control')};
    color: ${t('text-on-active')};
    font-weight: 700;
    cursor: default;
  }

  .control[disabled] {
    color: ${t('text-disabled')};
    cursor: default;
  }

  .control.vertical {
    flex-direction: column;
    align-items: stretch;
    gap: 6px;
    padding: 10px ${t('space-3')};
    border-inline-start: 0;
    border-block-end: ${t('line-1')} solid ${t('border-divider')};
    font-weight: 700;
    color: ${t('text')};
  }

  .control.vertical[aria-checked='true'] {
    color: ${t('text-on-active')};
  }

  .control.vertical .label {
    display: grid;
    gap: 6px;
  }

  .index {
    font-size: ${t('text-micro')};
    color: ${t('text-label')};
  }

  .control[aria-checked='true'] .index {
    color: inherit;
    font-weight: 700;
  }
`;
