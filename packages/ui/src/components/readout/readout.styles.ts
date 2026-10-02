import { css } from 'lit';
import { t } from '../../internal/tokens.js';

export const readoutStyles = css`
  .box {
    display: inline-flex;
    flex-direction: column;
    gap: 3px;
    padding: ${t('space-2')} ${t('space-3')};
    font-size: ${t('text-label-size')};
    text-transform: uppercase;
    background-color: ${t('fill')};
    border: ${t('line-1')} solid ${t('gray-7')};
  }

  .primary {
    color: ${t('text-highlight')};
  }

  .secondary {
    color: ${t('text-secondary')};
  }

  .hint {
    color: ${t('text-label')};
    letter-spacing: 0.1em;
  }
`;
