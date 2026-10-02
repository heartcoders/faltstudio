import { css } from 'lit';
import { focusRing, t } from '@faltstudio/ui';

/**
 * Aktionen im Redesign „Tisch & Papier“ (System D · Aktionen): Primaer hell
 * mit Pfeil, Sekundaer umrandet, Neu gestrichelt, Textaktion unterstrichen.
 */
export const startControlsStyles = css`
  .primary,
  .secondary,
  .plus,
  .text-action {
    all: unset;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    font-family: ${t('font-mono')};
    letter-spacing: ${t('track-label')};
    text-transform: uppercase;
    cursor: pointer;
  }

  .primary {
    justify-content: space-between;
    gap: ${t('space-5')};
    block-size: ${t('hit-primary')};
    padding-inline: 18px;
    font-size: 12px;
    font-weight: 700;
    color: ${t('text-on-active')};
    background-color: ${t('fill-active')};
  }

  .primary:hover {
    background-color: ${t('gray-9')};
  }

  .secondary {
    justify-content: center;
    block-size: ${t('hit-primary')};
    padding-inline: ${t('space-5')};
    font-size: ${t('text-label-size')};
    font-weight: 600;
    color: ${t('text')};
    border: ${t('line-1')} solid ${t('border-control')};
  }

  .secondary:hover,
  .plus:hover {
    background-color: ${t('card')};
  }

  .plus {
    justify-content: center;
    gap: ${t('space-3')};
    block-size: ${t('hit-primary')};
    min-inline-size: ${t('hit-primary')};
    font-size: 22px;
    color: ${t('text')};
    border: ${t('line-1')} dashed ${t('border-control')};
  }

  .text-action {
    block-size: ${t('hit')};
    padding-inline: ${t('space-1')};
    font-size: ${t('text-micro')};
    color: ${t('text')};
    border-block-end: ${t('line-1')} solid ${t('border-control')};
  }

  .text-action:hover {
    color: ${t('text-highlight')};
    border-block-end-color: ${t('text-highlight')};
  }

  :is(.primary, .secondary, .plus, .text-action):focus-visible {
    ${focusRing}
  }
`;
