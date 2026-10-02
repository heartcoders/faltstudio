import { css } from 'lit';
import { focusRing, labelText, microText, t } from '@faltstudio/ui';

export const fileMenuStyles = css`
  .file-menu {
    position: relative;
    display: flex;
    align-items: center;
    block-size: 100%;
  }

  .trigger {
    all: unset;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    gap: ${t('space-2')};
    block-size: ${t('hit')};
    padding-inline: ${t('space-1')};
    ${labelText}
    color: ${t('text')};
    border-block-end: ${t('line-1')} solid ${t('border-control')};
    cursor: pointer;
  }

  .trigger:hover {
    color: ${t('text-highlight')};
    border-block-end-color: ${t('text-highlight')};
  }

  .trigger[aria-expanded='true'] {
    color: ${t('text-highlight')};
    font-weight: 700;
    border-block-end: 2px solid ${t('text-highlight')};
  }

  .trigger:focus-visible,
  .entry:focus-visible {
    ${focusRing}
  }

  .menu {
    position: absolute;
    inset-block-start: calc(100% + 10px);
    inset-inline-end: 0;
    z-index: 20;
    inline-size: 300px;
    background-color: ${t('card')};
    border: ${t('line-1')} solid ${t('card-edge')};
    box-shadow: ${t('paper-shadow')};
  }

  .menu-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    block-size: 28px;
    margin: 0;
    padding-inline: ${t('space-3')};
    ${microText}
    border-block-end: ${t('line-1')} solid ${t('border-divider')};
  }

  .entries {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .entries li:last-child {
    margin-block-start: ${t('space-1')};
    border-block-start: ${t('line-1')} solid ${t('border-divider')};
  }

  .entry {
    all: unset;
    box-sizing: border-box;
    display: grid;
    grid-template-columns: 28px 1fr auto;
    align-items: center;
    gap: 10px;
    inline-size: 100%;
    block-size: ${t('hit')};
    padding-inline: ${t('space-3')};
    font-size: 12px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    cursor: pointer;
  }

  .entry:hover {
    background-color: ${t('fill-active')};
    color: ${t('text-on-active')};
    font-weight: 600;
  }

  .number,
  kbd {
    font-family: inherit;
    font-size: ${t('text-micro')};
    color: ${t('text-label')};
  }

  .entry:hover .number,
  .entry:hover kbd {
    color: inherit;
  }

  .language {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 0;
    padding-inline: ${t('space-3')} ${t('space-1')};
    font-size: ${t('text-micro')};
    letter-spacing: ${t('track-label')};
    text-transform: uppercase;
    color: ${t('text-label')};
    border-block-start: ${t('line-1')} solid ${t('border-divider')};
  }

  .note {
    margin: 0;
    padding: 10px ${t('space-3')};
    font-size: ${t('text-micro')};
    line-height: 1.5;
    letter-spacing: 0.08em;
    color: ${t('text-label')};
    border-block-start: ${t('line-1')} dashed ${t('border-frame')};
  }
`;
