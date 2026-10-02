import { css } from 'lit';

export const modelTurntableStyles = css`
  :host {
    display: block;
    min-block-size: 0;
  }

  .frame {
    position: relative;
    display: grid;
    block-size: 100%;
  }

  ::slotted(*) {
    grid-area: 1 / 1;
    transition: opacity 400ms ease;
  }

  canvas {
    grid-area: 1 / 1;
    inline-size: 100%;
    block-size: 100%;
    opacity: 0;
    transition: opacity 400ms ease;
  }

  .ready canvas {
    opacity: 1;
  }

  canvas.grab {
    cursor: grab;
    touch-action: none;
  }

  canvas.grab:active {
    cursor: grabbing;
  }

  .ready ::slotted(*) {
    opacity: 0;
  }

  @media (prefers-reduced-motion: reduce) {
    canvas,
    ::slotted(*) {
      transition: none;
    }
  }
`;
