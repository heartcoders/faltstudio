import { css } from 'lit';
import { displayText, focusRing, labelText, outlineIndex, t } from '@faltstudio/ui';

export const issuesPanelStyles = css`
  .panel {
    display: flex;
    flex-direction: column;
    inline-size: min(440px, 100vw);
    max-block-size: min(70vh, 640px);
    background-color: ${t('fill')};
    border: ${t('line-1')} solid ${t('border-control')};
  }

  .head {
    display: flex;
    align-items: center;
    gap: ${t('space-2')};
    padding: ${t('space-2')} ${t('space-2')} ${t('space-2')} ${t('space-4')};
    border-block-end: ${t('line-1')} solid ${t('border-divider')};
  }

  h2 {
    flex: 1;
    margin: 0;
    ${labelText}
    font-weight: 600;
  }

  .list {
    margin: 0;
    padding: 0;
    list-style: none;
    overflow-y: auto;
  }
`;

/** Mobile Karte (R8), nur mit dem Attribut `sheet`. */
export const issuesSheetStyles = css`
  .card {
    display: flex;
    flex-direction: column;
    padding: 0 ${t('space-5')} max(28px, env(safe-area-inset-bottom));
  }

  .card-head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-block-start: ${t('space-2')};
  }

  .card-heading {
    display: flex;
    align-items: flex-end;
    gap: 14px;
    margin: 0;
    ${displayText}
    font-size: 26px;
    font-weight: 500;
    text-transform: none;
  }

  .count {
    ${outlineIndex}
    font-size: ${t('text-index-small')};
  }

  .close,
  .adopt,
  .text-action {
    all: unset;
    box-sizing: border-box;
    cursor: pointer;
  }

  .close {
    display: grid;
    place-items: center;
    inline-size: ${t('hit')};
    block-size: ${t('hit')};
    font-size: 16px;
    color: ${t('text')};
  }

  .adopt {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-block-start: ${t('space-6')};
    min-block-size: 52px;
    padding-inline: 18px;
    ${labelText}
    font-weight: 700;
    color: ${t('text-on-active')};
    background-color: ${t('fill-active')};
  }

  .entries {
    margin: ${t('space-5')} 0 0;
    padding: 0;
    list-style: none;
    border-block-end: ${t('line-1')} solid ${t('border-divider')};
  }

  .entry {
    display: grid;
    grid-template-columns: 40px minmax(0, 1fr);
    gap: ${t('space-3')};
    padding-block: ${t('space-4')};
    border-block-start: ${t('line-1')} solid ${t('border-divider')};
  }

  .mark {
    display: grid;
    place-items: center;
    inline-size: 28px;
    block-size: 28px;
    font-size: 12px;
    font-weight: 700;
    border: ${t('line-1')} solid ${t('border-strong')};
  }

  .mark.error {
    font-size: ${t('text-label-size')};
    color: ${t('text-on-active')};
    background-color: ${t('fill-active')};
    border-color: ${t('fill-active')};
  }

  .entry-body {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .entry-title {
    margin: 0;
    font-family: ${t('font-display')};
    font-size: 18px;
    font-weight: 400;
  }

  .entry-text {
    margin: 0;
    font-size: 12px;
    line-height: ${t('line-height')};
    color: ${t('text-secondary')};
  }

  .entry-actions {
    display: flex;
    gap: ${t('space-5')};
  }

  .text-action {
    display: inline-flex;
    align-items: center;
    min-block-size: ${t('hit')};
    padding-inline: ${t('space-1')};
    font-size: ${t('text-micro')};
    letter-spacing: ${t('track-label')};
    text-transform: uppercase;
    color: ${t('text')};
    border-block-end: ${t('line-1')} solid ${t('border-control')};
  }

  .text-action.strong {
    font-weight: 700;
    color: ${t('text-highlight')};
    border-block-end: 2px solid ${t('text-highlight')};
  }

  .close:focus-visible,
  .adopt:focus-visible,
  .text-action:focus-visible {
    ${focusRing}
  }

  .passed {
    margin: ${t('space-4')} 0 0;
    font-size: ${t('text-label-size')};
    color: ${t('text-label')};
  }
`;
