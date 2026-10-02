import { css } from 'lit';
import { t } from '../../internal/tokens.js';

export const sceneStyles = css`
  :host {
    display: block;
    position: relative;
    min-block-size: 12rem;
  }

  canvas {
    display: block;
    inline-size: 100%;
    block-size: 100%;
    background-color: ${t('table')};
    touch-action: none;
  }
`;
