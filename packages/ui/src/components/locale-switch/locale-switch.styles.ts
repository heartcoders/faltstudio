import { css } from 'lit';
import { t } from '../../internal/tokens.js';
import { focusRing } from '../../internal/typography.js';

export const localeSwitchStyles = css`
  :host {
    display: inline-block;
  }

  .switch {
    display: flex;
    gap: ${t('space-1')};
  }

  button {
    all: unset;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-inline-size: ${t('hit')};
    min-block-size: ${t('hit')};
    font-size: ${t('text-micro')};
    letter-spacing: ${t('track-label')};
    color: ${t('text-label')};
    cursor: pointer;
  }

  button[aria-pressed='true'] {
    font-weight: 700;
    color: ${t('text-highlight')};
    text-decoration: underline;
    text-decoration-thickness: 2px;
    text-underline-offset: 6px;
  }

  button:focus-visible {
    ${focusRing}
  }
`;
