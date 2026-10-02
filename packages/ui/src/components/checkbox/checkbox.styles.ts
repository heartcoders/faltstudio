import { css } from 'lit';
import { t } from '../../internal/tokens.js';
import { focusRing } from '../../internal/typography.js';

export const checkboxStyles = css`
  .row {
    display: flex;
    align-items: center;
    gap: ${t('space-3')};
    min-block-size: ${t('hit')};
    padding-inline: ${t('space-3')};
    font-size: ${t('text-label-size')};
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: ${t('text')};
    cursor: pointer;
  }

  .row:hover {
    background-color: ${t('fill-hover')};
  }

  input {
    appearance: none;
    flex: none;
    inline-size: 14px;
    block-size: 14px;
    margin: 0;
    border: ${t('line-1')} solid ${t('border-control')};
    background-color: transparent;
    cursor: inherit;
  }

  input:checked {
    background-color: ${t('gray-8')};
    border-color: ${t('gray-8')};
  }

  input:focus-visible {
    ${focusRing}
  }

  input:disabled,
  input:disabled + .label {
    opacity: 0.4;
  }
`;
