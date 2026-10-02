import { css } from 'lit';
import { t } from '../../internal/tokens.js';
import { focusRing, microText } from '../../internal/typography.js';

export const sliderStyles = css`
  .slider {
    display: grid;
    gap: ${t('space-2')};
  }

  .track {
    position: relative;
    display: block;
    block-size: ${t('hit')};
    background:
      linear-gradient(${t('gray-9')}, ${t('gray-9')}) 0 20px / calc(var(--ratio) * 100%) 3px
        no-repeat,
      linear-gradient(${t('border-control')}, ${t('border-control')}) 0 21px / 100% 1px no-repeat,
      repeating-linear-gradient(90deg, ${t('gray-5')} 0 1px, transparent 1px 10%) 0 16px / 100% 11px
        no-repeat;
    border-inline-end: ${t('line-1')} solid transparent;
  }

  .track::after {
    content: '';
    position: absolute;
    inset-block-start: 10px;
    inset-inline-start: calc(var(--ratio) * 100% - 12px);
    inline-size: 24px;
    block-size: 24px;
    background: linear-gradient(${t('gray-0')}, ${t('gray-0')}) center / 1px 100% no-repeat
      ${t('gray-9')};
    pointer-events: none;
  }

  input {
    position: absolute;
    inset: 0;
    inline-size: 100%;
    block-size: 100%;
    margin: 0;
    opacity: 0;
    cursor: ew-resize;
  }

  .track:has(input:focus-visible) {
    ${focusRing}
  }

  .track:has(input:disabled) {
    opacity: 0.4;
  }

  .scale {
    display: flex;
    justify-content: space-between;
    ${microText}
  }
`;
