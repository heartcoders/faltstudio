import { css } from 'lit';
import { LOCKED } from '../config.js';

const hidden = css`
  :host([hidden]) {
    display: none !important;
  }
`;

/**
 * Locked: der Host hat keine eigene Box, das gerenderte Element nimmt direkt am
 * Layout des Parents teil. Komponenten, die eine Box brauchen (fl-scene),
 * ueberschreiben `:host` in ihren eigenen Styles.
 */
export const hostStyles = LOCKED
  ? css`
      :host {
        display: contents;
      }
      ${hidden}
    `
  : css`
      :host {
        display: inline-block;
      }
      :host > * {
        inline-size: 100%;
        min-block-size: 100%;
      }
      ${hidden}
    `;
