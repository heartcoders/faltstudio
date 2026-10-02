import { css } from 'lit';
import { focusRing, labelText, microText, t } from '@faltstudio/ui';

export const sharePanelStyles = css`
  :host {
    display: block;
  }

  .panel {
    display: grid;
    justify-items: center;
    gap: ${t('space-3')};
  }

  .qr {
    display: block;
    inline-size: min(360px, 100%);
    aspect-ratio: 1;
  }

  .placeholder {
    background: repeating-linear-gradient(-35deg, ${t('gray-1')} 0 10px, ${t('gray-2')} 10px 20px);
    border: ${t('line-1')} solid ${t('border-frame')};
  }

  .qr-light {
    fill: ${t('gray-9')};
  }

  .qr-dark {
    fill: ${t('gray-0')};
  }

  .link {
    overflow: hidden;
    inline-size: 100%;
    margin: 0;
    padding: ${t('space-2')} ${t('space-3')};
    font-size: ${t('text-micro')};
    color: ${t('text-secondary')};
    white-space: nowrap;
    text-overflow: ellipsis;
    border: ${t('line-1')} dotted ${t('border-control')};
  }

  .note,
  .too-large {
    margin: 0;
    ${microText}
    line-height: 1.6;
    text-align: center;
  }

  .too-large {
    padding: ${t('space-6')} ${t('space-4')};
    color: ${t('text-secondary')};
    border: ${t('line-1')} dashed ${t('border-control')};
  }

  .actions {
    display: grid;
    gap: ${t('space-2')};
    inline-size: 100%;
  }

  .actions.two {
    grid-template-columns: 1fr 1fr;
  }

  .button {
    all: unset;
    box-sizing: border-box;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    min-block-size: 56px;
    padding-inline: ${t('space-3')};
    ${labelText}
    font-weight: 600;
    color: ${t('text')};
    border: ${t('line-1')} solid ${t('border-strong')};
    cursor: pointer;
  }

  .button:hover {
    background-color: ${t('fill-hover')};
  }

  .button:focus-visible {
    ${focusRing}
  }

  .button.primary {
    background-color: ${t('fill-active')};
    border-color: ${t('fill-active')};
    color: ${t('text-on-active')};
  }

  .visually-hidden {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    clip-path: inset(50%);
  }
`;
