import { css } from 'lit';
import { displayText, focusRing, labelText, microText, t } from '@faltstudio/ui';

export const editorHeaderStyles = css`
  .header {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr) auto auto;
    align-items: center;
    gap: ${t('space-6')};
    block-size: 72px;
    padding-inline: ${t('space-3')} ${t('space-6')};
    background-color: ${t('table')};
  }

  .file {
    display: flex;
    align-items: center;
    gap: ${t('space-2')};
    min-inline-size: 0;
  }

  .back {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    inline-size: ${t('hit')};
    block-size: ${t('hit')};
    font-size: ${t('text-h2')};
    color: ${t('text')};
    text-decoration: none;
  }

  .back:hover {
    color: ${t('text-highlight')};
  }

  .name-block {
    display: grid;
    gap: 2px;
    min-inline-size: 0;
    margin: 0;
  }

  .name {
    ${displayText}
    font-size: 18px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .status {
    ${microText}
    font-size: 9px;
    letter-spacing: 0.16em;
  }

  .modes {
    display: flex;
    gap: ${t('space-8')};
  }

  .mode,
  .issues,
  .text-action {
    all: unset;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    block-size: ${t('hit')};
    cursor: pointer;
  }

  .mode {
    ${labelText}
    letter-spacing: 0.16em;
    color: ${t('text-label')};
    border-block-end: 2px solid transparent;
  }

  .mode:hover {
    color: ${t('text')};
  }

  .mode[aria-current='page'] {
    font-weight: 700;
    color: ${t('text-highlight')};
    border-block-end-color: ${t('text-highlight')};
  }

  .issues {
    justify-self: end;
    gap: ${t('space-2')};
    padding-inline: ${t('space-1')};
    font-size: ${t('text-label-size')};
    font-weight: 700;
  }

  .issues .error {
    padding: 3px 6px;
    background-color: ${t('fill-active')};
    color: ${t('text-on-active')};
  }

  .issues .warning {
    padding: 2px 6px;
    border: ${t('line-1')} solid ${t('border-control')};
  }

  .issues .ok {
    font-weight: 400;
    color: ${t('text-label')};
  }

  .issues[aria-expanded='true'] {
    border-block-end: 2px solid ${t('text-highlight')};
  }

  .text-action {
    padding-inline: ${t('space-1')};
    ${labelText}
    color: ${t('text')};
    border-block-end: ${t('line-1')} solid ${t('border-control')};
  }

  .text-action.strong {
    font-weight: 700;
    color: ${t('text-highlight')};
    border-block-end: 2px solid ${t('text-highlight')};
  }

  :is(.back, .mode, .issues, .text-action):focus-visible {
    ${focusRing}
  }

  @media (max-width: 64rem) {
    .modes {
      gap: ${t('space-4')};
    }

    .status {
      display: none;
    }
  }
`;
