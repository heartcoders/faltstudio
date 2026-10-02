import { css } from 'lit';
import { t } from '../../internal/tokens.js';
import { focusRing, microText } from '../../internal/typography.js';

export const sheetStyles = css`
  :host {
    display: block;
  }

  .sheet {
    display: flex;
    flex-direction: column;
    background-color: ${t('card')};
    border-block-start: ${t('line-1')} solid ${t('card-edge')};
    box-shadow: ${t('card-shadow')};
    transition: block-size 180ms ${t('ease')};
  }

  .level-peek {
    block-size: auto;
  }

  .level-half {
    block-size: 50dvh;
  }

  .level-full {
    block-size: calc(100dvh - 56px);
  }

  .grip {
    all: unset;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    flex: none;
    block-size: 20px;
    cursor: grab;
    touch-action: none;
  }

  .grip:focus-visible {
    ${focusRing}
    outline-offset: -4px;
  }

  .bar {
    inline-size: 36px;
    block-size: 3px;
    background-color: ${t('gray-6')};
  }

  .level-full .bar {
    background-color: ${t('gray-8')};
  }

  .level {
    display: none;
    ${microText}
  }

  .head {
    flex: none;
  }

  .body {
    flex: 1;
    min-block-size: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  .level-peek .body {
    display: none;
  }

  .sheet.floating {
    block-size: auto;
    max-block-size: 90dvh;
    border: ${t('line-1')} solid ${t('card-edge')};
  }

  .floating .grip {
    display: none;
  }

  .floating .body {
    display: block;
  }

  @media (prefers-reduced-motion: reduce) {
    .sheet {
      transition: none;
    }
  }
`;
