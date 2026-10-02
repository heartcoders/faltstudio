import { css } from 'lit';
import { t } from '../../internal/tokens.js';
import { visuallyHidden } from '../../internal/visually-hidden.js';
import { focusRing } from '../../internal/typography.js';

export const stepCardStyles = css`
  .card {
    all: unset;
    box-sizing: border-box;
    position: relative;
    display: grid;
    grid-template-rows: 24px 1fr auto;
    inline-size: 128px;
    block-size: 112px;
    font-family: ${t('font-mono')};
    font-size: ${t('text-label-size')};
    color: ${t('text-secondary')};
    border: ${t('line-1')} solid ${t('border-frame')};
    cursor: pointer;
  }

  .card:hover {
    border-color: ${t('border-control')};
  }

  .card:focus-visible {
    ${focusRing}
  }

  .card.warning {
    border-style: dashed;
    border-color: ${t('border-strong')};
  }

  .card[aria-current='step'] {
    border: ${t('line-2')} solid ${t('gray-9')};
  }

  .card.compact {
    grid-template-rows: 24px 1fr;
    inline-size: 72px;
    block-size: 76px;
  }

  .compact .title {
    ${visuallyHidden}
  }

  .head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-inline: ${t('space-2')};
    font-size: ${t('text-micro')};
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  [aria-current='step'] .head {
    background-color: ${t('fill-active')};
    color: ${t('text-on-active')};
  }

  .index {
    font-size: 12px;
  }

  .diagram {
    display: grid;
    place-items: center;
    padding: ${t('space-1')};
    min-block-size: 0;
  }

  ::slotted([slot='diagram']) {
    inline-size: 100%;
    block-size: 44px;
  }

  .title {
    display: flex;
    align-items: center;
    min-block-size: 30px;
    padding: ${t('space-1')} ${t('space-2')};
    font-size: ${t('text-label-size')};
    line-height: 1.25;
    color: ${t('text')};
    border-block-start: ${t('line-1')} solid ${t('border-divider')};
  }

  .badge {
    position: absolute;
    inset-inline-end: 6px;
    inset-block-start: 32px;
    padding: 1px 5px;
    font-size: ${t('text-micro')};
    font-weight: 700;
    color: ${t('text')};
    background-color: ${t('fill')};
    border: ${t('line-1')} solid ${t('border-strong')};
  }

  .sr {
    ${visuallyHidden}
  }
`;
