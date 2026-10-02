import { css } from 'lit';
import { displayText, focusRing, labelText, microText, t } from '@faltstudio/ui';

export const editorAppStyles = css`
  :host {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr) auto;
    block-size: 100dvh;
  }

  .workspace {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    min-block-size: 0;
  }

  .issues-popover {
    position: absolute;
    z-index: 30;
    inset-block-start: 8px;
    inset-inline-end: ${t('space-6')};
    box-shadow: ${t('paper-shadow')};
  }

  /* Mobil: Sheets ueber der Flaeche, die Flaeche dahinter abgedunkelt (C10). */
  .sheet-layer {
    position: fixed;
    z-index: 40;
    inset: 0;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    background-color: ${t('scrim')};
  }

  .sheet-layer fl-issues-panel {
    display: block;
  }

  .sheet-head {
    margin: 0;
    padding: ${t('space-2')} ${t('space-4')} ${t('space-3')};
    ${displayText}
    font-size: 22px;
  }

  .commands {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .commands button {
    all: unset;
    box-sizing: border-box;
    display: grid;
    grid-template-columns: 32px 1fr auto;
    align-items: center;
    inline-size: 100%;
    min-block-size: ${t('hit-primary')};
    padding-inline: ${t('space-4')};
    ${labelText}
    border-block-start: ${t('line-1')} solid ${t('border-divider')};
    cursor: pointer;
  }

  .commands button:active {
    background-color: ${t('fill-active')};
    color: ${t('text-on-active')};
  }

  .commands button:focus-visible,
  .close:focus-visible {
    ${focusRing}
    outline-offset: -3px;
  }

  .number,
  .note {
    ${microText}
  }

  .language {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 0;
    padding-inline: ${t('space-4')} ${t('space-2')};
    ${microText}
    border-block-end: ${t('line-1')} solid ${t('border-divider')};
  }

  .sheet-foot {
    padding: ${t('space-4')};
  }

  .close {
    all: unset;
    box-sizing: border-box;
    display: flex;
    justify-content: center;
    align-items: center;
    inline-size: 100%;
    min-block-size: ${t('hit-primary')};
    ${labelText}
    font-weight: 600;
    border: ${t('line-1')} solid ${t('border-control')};
    cursor: pointer;
  }
`;
