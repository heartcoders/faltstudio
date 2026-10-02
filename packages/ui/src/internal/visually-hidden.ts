import { css } from 'lit';

/** Sichtbar fuer Screenreader, unsichtbar fuer Augen. */
export const visuallyHidden = css`
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  clip-path: inset(50%);
  overflow: hidden;
  white-space: nowrap;
`;
