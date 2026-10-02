import { css } from 'lit';
import { t } from '../../internal/tokens.js';
import { focusRing } from '../../internal/typography.js';

export const stepTrackStyles = css`
  .track {
    position: relative;
    display: grid;
    grid-template-columns: repeat(var(--steps), 1fr);
    min-block-size: 36px;
    border-inline-end: ${t('line-1')} solid ${t('border-control')};
    background:
      linear-gradient(${t('gray-9')}, ${t('gray-9')}) 0 calc(100% - 8px) / calc(var(--ratio) * 100%)
        3px no-repeat,
      repeating-linear-gradient(90deg, ${t('gray-5')} 0 1px, transparent 1px 4px) 0
        calc(100% - 9px) / 100% 1px no-repeat;
  }

  .cell {
    padding: 2px 0 0 6px;
    font-size: ${t('text-micro')};
    color: ${t('text-label')};
    border-inline-start: ${t('line-1')} solid ${t('border-control')};
  }

  .cell.reached {
    color: ${t('text-highlight')};
    font-weight: 700;
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
`;
