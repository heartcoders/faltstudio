import { css } from 'lit';
import { focusRing, labelText, microText, t } from '@faltstudio/ui';

/** Modellmenue der Startseite: Sheet ueber dem abgedunkelten Tisch. */
export const modelOverlayStyles = css`
  .overlay {
    position: fixed;
    z-index: 10;
    inset: 0;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    background-color: ${t('scrim')};
  }

  .sheet-head {
    display: grid;
    grid-template-columns: minmax(0, 1fr) ${t('hit')};
    align-items: center;
    padding-inline-start: ${t('space-4')};
    border-block-end: ${t('line-1')} solid ${t('border-divider')};
  }

  .sheet-head p {
    overflow: hidden;
    margin: 0;
    ${labelText}
    font-weight: 600;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .close {
    all: unset;
    display: grid;
    place-items: center;
    inline-size: ${t('hit')};
    block-size: ${t('hit')};
    font-size: 16px;
    cursor: pointer;
  }

  .close:focus-visible,
  .menu-row:focus-visible {
    ${focusRing}
    outline-offset: -3px;
  }

  .overlay-body {
    display: grid;
    gap: ${t('space-3')};
    padding: ${t('space-4')};
  }

  .menu {
    display: grid;
  }

  .menu-row {
    all: unset;
    box-sizing: border-box;
    display: flex;
    justify-content: space-between;
    align-items: center;
    min-block-size: ${t('hit-primary')};
    ${labelText}
    color: ${t('text')};
    border-block-end: ${t('line-1')} solid ${t('border-divider')};
    cursor: pointer;
  }

  .menu-row:hover {
    color: ${t('text-highlight')};
  }

  .confirm-title {
    margin: 0;
    font-family: ${t('font-display')};
    font-size: ${t('text-h2')};
    font-weight: 500;
  }

  .overlay-meta {
    margin: 0;
    ${microText}
  }

  .confirm-text {
    margin: 0;
    color: ${t('text-secondary')};
  }

  .confirm-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: ${t('space-2')};
  }

  @media (min-width: 48rem) {
    .overlay {
      justify-content: center;
      align-items: center;
    }

    .overlay fl-sheet {
      inline-size: min(440px, 100% - ${t('space-8')});
    }
  }
`;
