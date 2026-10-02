import { css } from 'lit';
import { t } from '../../internal/tokens.js';

const mark = t('gray-7');

export const panelStyles = css`
  .panel {
    display: flex;
    flex-direction: column;
    min-block-size: 0;
    background-color: ${t('fill')};
  }

  .panel.stretch {
    block-size: 100%;
  }

  .panel.marks {
    background-image:
      linear-gradient(${mark}, ${mark}), linear-gradient(${mark}, ${mark}),
      linear-gradient(${mark}, ${mark}), linear-gradient(${mark}, ${mark}),
      linear-gradient(${mark}, ${mark}), linear-gradient(${mark}, ${mark}),
      linear-gradient(${mark}, ${mark}), linear-gradient(${mark}, ${mark});
    background-size:
      10px 1px,
      1px 10px,
      10px 1px,
      1px 10px,
      10px 1px,
      1px 10px,
      10px 1px,
      1px 10px;
    background-position:
      0 0,
      0 0,
      100% 0,
      100% 0,
      0 100%,
      0 100%,
      100% 100%,
      100% 100%;
    background-repeat: no-repeat;
    padding: ${t('space-2')} ${t('space-3')};
  }

  .head {
    display: flex;
    align-items: stretch;
    min-block-size: 36px;
    border-block-end: ${t('line-1')} solid ${t('border-divider')};
  }

  .marks .head {
    min-block-size: 28px;
  }

  .letter {
    display: flex;
    align-items: center;
    justify-content: center;
    inline-size: 36px;
    flex: none;
    font-size: ${t('text-label-size')};
    color: ${t('text-label')};
    border-inline-end: ${t('line-1')} solid ${t('border-divider')};
  }

  .title {
    display: flex;
    align-items: center;
    flex: 1;
    margin: 0;
    padding-inline: ${t('space-3')};
    font-size: ${t('text-label-size')};
    font-weight: 600;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: ${t('text')};
  }

  .marks .title {
    padding-inline: 0;
    font-weight: 400;
    color: ${t('text-label')};
  }

  .meta {
    display: flex;
    align-items: center;
    padding-inline: ${t('space-3')};
    font-size: ${t('text-micro')};
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: ${t('text-label')};
  }

  .content {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-block-size: 0;
  }

  .stretch .content {
    overflow: auto;
  }
`;
