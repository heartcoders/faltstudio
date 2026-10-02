import { css } from 'lit';
import { focusRing, labelText, microText, t } from '@faltstudio/ui';

export const doneSheetStyles = css`
  .layer {
    position: fixed;
    z-index: 40;
    inset: 0;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    background-color: rgb(0 0 0 / 0.55);
  }

  .head {
    display: grid;
    grid-template-columns: minmax(0, 1fr) ${t('hit')};
    align-items: center;
    padding-inline-start: ${t('space-4')};
    border-block-end: ${t('line-1')} solid ${t('border-divider')};
  }

  .title {
    margin: 0;
    ${labelText}
    font-weight: 600;
  }

  .close {
    all: unset;
    display: grid;
    place-items: center;
    inline-size: ${t('hit')};
    block-size: ${t('hit')};
    font-size: 16px;
    border-inline-start: ${t('line-1')} solid ${t('border-divider')};
    cursor: pointer;
  }

  .body {
    display: grid;
    gap: ${t('space-4')};
    padding: ${t('space-4')};
  }

  .summary {
    margin: 0;
    ${microText}
  }

  .choices {
    display: grid;
    gap: ${t('space-2')};
  }

  .button {
    all: unset;
    box-sizing: border-box;
    display: flex;
    justify-content: space-between;
    align-items: center;
    min-block-size: 56px;
    padding-inline: ${t('space-4')};
    ${labelText}
    font-weight: 600;
    color: ${t('text')};
    border: ${t('line-1')} solid ${t('border-strong')};
    cursor: pointer;
  }

  .button:hover {
    background-color: ${t('fill-hover')};
  }

  .button.primary {
    background-color: ${t('fill-active')};
    border-color: ${t('fill-active')};
    color: ${t('text-on-active')};
  }

  .button:focus-visible,
  .close:focus-visible {
    ${focusRing}
    outline-offset: -3px;
  }

  @media (min-width: 48rem) {
    .layer {
      justify-content: center;
      align-items: center;
    }

    fl-sheet {
      inline-size: min(440px, 100% - ${t('space-8')});
    }
  }
`;
