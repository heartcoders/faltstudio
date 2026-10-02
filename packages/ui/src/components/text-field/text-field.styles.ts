import { css } from 'lit';
import { t } from '../../internal/tokens.js';
import { focusRing, microText } from '../../internal/typography.js';

export const textFieldStyles = css`
  .text-field {
    display: grid;
    gap: 6px;
  }

  label {
    ${microText}
  }

  .field {
    box-sizing: border-box;
    inline-size: 100%;
    min-block-size: ${t('hit')};
    margin: 0;
    padding: ${t('space-2')} ${t('space-3')};
    font-family: ${t('font-mono')};
    font-size: ${t('text-body')};
    line-height: ${t('line-height')};
    color: ${t('text')};
    background-color: transparent;
    border: ${t('line-1')} solid ${t('border-control')};
    border-radius: 0;
    resize: vertical;
  }

  input.field {
    font-size: 14px;
    color: ${t('text-highlight')};
  }

  textarea.field {
    font-size: 12px;
    color: ${t('text-secondary')};
    border-color: ${t('border-frame')};
  }

  .field:hover {
    border-color: ${t('border-strong')};
  }

  .field:focus-visible {
    ${focusRing}
  }
`;
