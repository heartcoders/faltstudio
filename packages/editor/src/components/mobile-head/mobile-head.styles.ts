import { css } from 'lit';
import { displayText, focusRing, microText, t } from '@faltstudio/ui';

export const mobileHeadStyles = css`
  .head {
    display: grid;
    background-color: ${t('table')};
  }

  .row {
    display: grid;
    grid-template-columns: ${t('hit')} minmax(0, 1fr) auto ${t('hit')};
    gap: 6px;
    align-items: center;
    block-size: 52px;
    padding-inline: ${t('space-2')};
  }

  .square,
  .issues,
  .mode {
    all: unset;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }

  .square {
    inline-size: ${t('hit')};
    block-size: ${t('hit')};
    font-size: 20px;
    color: ${t('text')};
  }

  .square:focus-visible,
  .issues:focus-visible,
  .mode:focus-visible {
    ${focusRing}
    outline-offset: -3px;
  }

  .issues {
    gap: ${t('space-2')};
    block-size: ${t('hit')};
    padding-inline: 10px;
    font-size: ${t('text-label-size')};
    font-weight: 700;
    color: ${t('text-highlight')};
  }

  .issues.ok {
    font-weight: 400;
    color: ${t('text-label')};
  }

  .issues .error {
    padding: 3px 6px;
    background-color: ${t('fill-active')};
    color: ${t('text-on-active')};
  }

  .issues .warning {
    padding: 2px 6px;
    border: ${t('line-1')} solid ${t('border-control')};
  }

  .file {
    display: grid;
    gap: 2px;
    min-inline-size: 0;
    margin: 0;
  }

  .name,
  .sub {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .name {
    ${displayText}
    font-size: 17px;
    letter-spacing: 0;
    line-height: 1.2;
  }

  .sub {
    ${microText}
    font-size: 9px;
    letter-spacing: 0.16em;
  }

  .modes {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    block-size: ${t('hit')};
    padding-inline: ${t('space-3')};
  }

  .mode {
    font-size: ${t('text-label-size')};
    font-weight: 500;
    letter-spacing: ${t('track-label')};
    text-transform: uppercase;
    color: ${t('text-label')};
    border-block-end: ${t('line-1')} solid ${t('border-divider')};
  }

  .mode[aria-pressed='true'] {
    font-weight: 700;
    color: ${t('text-highlight')};
    border-block-end: 2px solid ${t('text-highlight')};
  }
`;
