import { css } from 'lit';
import { displayText, focusRing, labelText, microText, t } from '@faltstudio/ui';

export const issuesCardStyles = css`
  :host {
    display: block;
  }

  .card {
    display: flex;
    flex-direction: column;
    padding: ${t('space-4')} ${t('space-5')};
    background-color: ${t('card')};
    border: ${t('line-1')} solid ${t('card-edge')};
    box-shadow: ${t('paper-shadow')};
  }

  .head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-block-end: ${t('space-1')};
  }

  h2 {
    margin: 0;
    ${displayText}
    font-size: ${t('text-h2')};
  }

  .counts {
    all: unset;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    min-block-size: ${t('hit')};
    ${microText}
    cursor: pointer;
  }

  .counts:hover {
    color: ${t('text')};
  }

  .rows {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .row {
    display: grid;
    grid-template-columns: 32px minmax(0, 1fr) auto;
    gap: 10px;
    align-items: center;
    min-block-size: 52px;
    border-block-start: ${t('line-1')} solid ${t('border-divider')};
  }

  .mark {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    inline-size: 24px;
    block-size: 24px;
    font-size: ${t('text-micro')};
    font-weight: 700;
  }

  .mark.error {
    color: ${t('text-on-active')};
    background-color: ${t('fill-active')};
  }

  .mark.warning {
    border: ${t('line-1')} solid ${t('border-strong')};
  }

  .text {
    margin: 0;
    overflow: hidden;
    font-size: 12px;
    white-space: nowrap;
    text-overflow: ellipsis;
    color: ${t('text-secondary')};
  }

  .text b {
    font-weight: 400;
    color: ${t('text')};
  }

  .text-action {
    all: unset;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    block-size: ${t('hit')};
    padding-inline: ${t('space-1')};
    ${labelText}
    font-size: ${t('text-micro')};
    color: ${t('text')};
    border-block-end: ${t('line-1')} solid ${t('border-control')};
    cursor: pointer;
  }

  .text-action.strong {
    font-weight: 700;
    color: ${t('text-highlight')};
    border-block-end: 2px solid ${t('text-highlight')};
  }

  :is(.counts, .text-action):focus-visible {
    ${focusRing}
  }
`;
