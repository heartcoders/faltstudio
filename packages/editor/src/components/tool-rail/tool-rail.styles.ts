import { css } from 'lit';
import { focusRing, microText, t } from '@faltstudio/ui';

export const toolRailStyles = css`
  :host {
    display: block;
    min-block-size: 0;
  }

  .tools {
    display: flex;
    flex-direction: column;
    gap: ${t('space-1')};
    block-size: 100%;
    padding: ${t('space-12')} ${t('space-3')} ${t('space-6')} ${t('space-6')};
    overflow-y: auto;
    font-size: ${t('text-label-size')};
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  h2 {
    margin: ${t('space-5')} 0 ${t('space-2')};
    font-size: 9px;
    font-weight: 400;
    letter-spacing: 0.2em;
    color: ${t('text-disabled')};
  }

  h2:first-child {
    margin-block-start: 0;
  }

  ul {
    display: grid;
    gap: ${t('space-1')};
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .row,
  .target {
    all: unset;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    gap: ${t('space-3')};
    inline-size: calc(100% + ${t('space-3')});
    min-block-size: ${t('hit')};
    margin-inline-start: calc(${t('space-3')} * -1);
    padding-inline: ${t('space-3')};
    color: ${t('text-label')};
    cursor: pointer;
  }

  .row:hover,
  .target:hover {
    color: ${t('text')};
  }

  .row[aria-pressed='true'] {
    font-weight: 700;
    color: ${t('text-on-active')};
    background-color: ${t('fill-active')};
  }

  .row.kind[aria-pressed='true'] {
    color: ${t('text-highlight')};
    background-color: transparent;
  }

  .row.toggle[aria-pressed='true'] {
    font-weight: 400;
    color: ${t('text')};
    background-color: transparent;
  }

  .key {
    font-size: 9px;
  }

  .badge {
    min-inline-size: 3ch;
    padding: 1px 5px;
    font-size: 9px;
    font-weight: 700;
    text-align: center;
    border: ${t('line-1')} solid ${t('border-frame')};
  }

  .badge.on {
    color: ${t('text-on-active')};
    background-color: ${t('fill-active')};
    border-color: ${t('fill-active')};
  }

  /* Umbrechen statt fester Spalten: die englischen Woerter sind laenger. */
  .targets {
    display: flex;
    flex-wrap: wrap;
    gap: 0 ${t('space-3')};
    padding-inline-start: ${t('space-8')};
  }

  .target {
    inline-size: auto;
    margin: 0;
    padding: 0;
    font-size: 9px;
    letter-spacing: 0.14em;
    text-decoration: line-through;
  }

  .target[aria-pressed='true'] {
    color: ${t('text-secondary')};
    text-decoration: none;
  }

  :is(.row, .target):focus-visible {
    ${focusRing}
    outline-offset: -3px;
  }

  .sample {
    display: block;
    flex: none;
    inline-size: 28px;
    block-size: 4px;
  }

  .sample-line {
    stroke: currentColor;
    stroke-width: 1.5;
  }

  .sample-line.valley {
    stroke-dasharray: ${t('dash-valley')};
  }

  .sample-line.mountain {
    stroke-dasharray: ${t('dash-mountain')};
  }

  .sample-line.flat {
    stroke-width: 1;
    stroke-dasharray: ${t('dash-flat')};
  }

  .hint {
    margin: auto 0 0;
    padding-block-start: ${t('space-5')};
    ${microText}
    font-size: 9px;
    line-height: 1.6;
    letter-spacing: 0.08em;
    text-transform: none;
  }
`;
