import { css } from 'lit';
import { t } from '../../internal/tokens.js';
import { visuallyHidden } from '../../internal/visually-hidden.js';

export const issueStyles = css`
  .row {
    display: grid;
    grid-template-columns: 56px 1fr auto;
    align-items: center;
    gap: ${t('space-3')};
    min-block-size: 52px;
    padding-inline-end: ${t('space-3')};
    border-block-end: ${t('line-1')} solid ${t('border-divider')};
  }

  .mark {
    justify-self: center;
    display: grid;
    place-items: center;
    inline-size: 30px;
    block-size: 30px;
    font-size: ${t('text-label-size')};
    font-weight: 700;
  }

  .severity-error .mark {
    background-color: ${t('gray-8')};
    color: ${t('text-on-active')};
  }

  .severity-warning .mark {
    border: ${t('line-1')} solid ${t('border-strong')};
  }

  .severity-ok .mark {
    border: ${t('line-1')} dotted ${t('border-control')};
    font-size: ${t('text-micro')};
    font-weight: 400;
  }

  .severity-ok {
    color: ${t('text-secondary')};
  }

  .body {
    display: grid;
    gap: 2px;
    margin: 0;
    padding-block: ${t('space-2')};
    font-size: 12px;
    line-height: 1.4;
  }

  .heading {
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: ${t('text-highlight')};
  }

  .sr {
    ${visuallyHidden}
  }
`;
