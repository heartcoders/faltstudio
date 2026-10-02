import { css } from 'lit';
import { focusRing, t } from '@faltstudio/ui';

export const modePhotoStyles = css`
  :host {
    display: block;
    min-block-size: 0;
  }

  /* Desktop: das Foto liegt wie ein Abzug auf dem Tisch, Einstellungen als dunkle Karte. */
  .layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 300px;
    block-size: 100%;
    background-color: ${t('table')};
  }

  .layout > .context {
    margin: ${t('space-6')} ${t('space-6')} ${t('space-6')} 0;
    background-color: ${t('card')};
    border: ${t('line-1')} solid ${t('card-edge')};
    box-shadow: ${t('paper-shadow')};
  }

  .layout .photo {
    filter: drop-shadow(${t('paper-shadow')});
  }

  .layout .loupe-box {
    inset-inline-start: ${t('space-6')};
    background-color: ${t('card')};
    border-color: ${t('card-edge')};
    box-shadow: ${t('paper-shadow')};
  }

  .left,
  .right {
    display: flex;
    flex-direction: column;
    min-block-size: 0;
    overflow-y: auto;
  }

  .left {
    border-inline-end: ${t('line-1')} solid ${t('border-frame')};
  }

  .right {
    border-inline-start: ${t('line-1')} solid ${t('border-frame')};
  }

  .pad {
    padding: ${t('space-4')};
  }

  .source {
    display: grid;
    grid-template-columns: 88px 1fr;
    gap: ${t('space-3')};
    padding: ${t('space-4')};
  }

  img.thumb {
    display: block;
    inline-size: 100%;
    max-block-size: 140px;
    object-fit: contain;
    padding: 0;
    background: none;
    border: ${t('line-1')} solid ${t('border-frame')};
  }

  .thumb {
    grid-row: span 3;
    display: flex;
    align-items: end;
    block-size: 88px;
    padding: 6px;
    font-size: ${t('text-micro')};
    letter-spacing: ${t('track-label')};
    text-transform: uppercase;
    color: ${t('text-label')};
    background: repeating-linear-gradient(-35deg, ${t('gray-1')} 0 6px, ${t('gray-2')} 6px 12px);
    border: ${t('line-1')} dashed ${t('border-frame')};
  }

  .file {
    margin: 0;
    font-size: ${t('text-label-size')};
  }

  .handles {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .handle-row {
    all: unset;
    box-sizing: border-box;
    display: grid;
    grid-template-columns: 32px 1fr 88px;
    align-items: center;
    inline-size: 100%;
    block-size: ${t('hit')};
    padding-inline: ${t('space-4')};
    font-size: ${t('text-label-size')};
    border-block-end: ${t('line-1')} solid ${t('border-divider')};
    cursor: pointer;
  }

  .handle-row:hover {
    background-color: ${t('fill-hover')};
  }

  .handle-row:focus-visible {
    ${focusRing}
    outline-offset: -3px;
  }

  .handle-row[aria-pressed='true'] {
    background-color: ${t('fill-active')};
    color: ${t('text-on-active')};
    font-weight: 700;
  }

  .handle-id,
  .handle-mm {
    color: ${t('text-label')};
  }

  [aria-pressed='true'] .handle-id,
  [aria-pressed='true'] .handle-mm {
    color: inherit;
  }

  .apply {
    display: grid;
    margin-block-start: auto;
    padding: ${t('space-4')};
    border-block-start: ${t('line-1')} solid ${t('border-divider')};
  }

  .stage {
    display: grid;
    padding: ${t('space-4')};
  }

  .row {
    display: flex;
    flex-wrap: wrap;
    gap: ${t('space-2')};
  }

  .hint {
    margin: 0;
    font-size: ${t('text-micro')};
    line-height: 1.5;
    color: ${t('text-label')};
  }

  .hint.warn {
    color: ${t('text-highlight')};
  }

  .loupe-box {
    inline-size: 168px;
    aspect-ratio: auto;
    inset-block-end: auto;
    inset-block-start: ${t('space-4')};
  }

  .surface {
    flex: 1;
    display: grid;
    padding: ${t('space-4')};
  }

  .photo-view {
    inline-size: 100%;
    block-size: 100%;
    font-family: ${t('font-mono')};
    touch-action: none;
    cursor: crosshair;
  }

  .photo-view:focus {
    outline: none;
  }

  .photo-view:focus-visible {
    ${focusRing}
  }

  .photo-view * {
    vector-effect: non-scaling-stroke;
  }

  .photo {
    opacity: var(--photo-opacity);
  }

  .quad {
    fill: none;
    stroke: ${t('gray-8')};
    stroke-width: 1.5;
  }

  .target {
    fill: none;
    stroke: ${t('gray-6')};
    stroke-dasharray: ${t('dash-ghost')};
  }

  .handle {
    fill: none;
    stroke: ${t('gray-9')};
    stroke-width: 1.5;
  }

  .halo {
    fill: none;
    stroke: ${t('gray-9')};
    stroke-dasharray: 3 3;
  }

  .handle-cross {
    fill: none;
    stroke: ${t('gray-8')};
  }

  .tag {
    fill: ${t('gray-0')};
    stroke: ${t('gray-8')};
  }

  .tag.active {
    fill: ${t('gray-9')};
  }

  .tag-text {
    fill: ${t('gray-8')};
    font-weight: 700;
    letter-spacing: 1px;
  }

  .tag-text.active {
    fill: ${t('gray-0')};
  }

  .empty {
    display: grid;
    place-content: center;
    justify-items: center;
    gap: ${t('space-4')};
  }

  .loupe {
    display: block;
    inline-size: 100%;
    aspect-ratio: 1;
    background: repeating-linear-gradient(-35deg, ${t('gray-1')} 0 10px, ${t('gray-2')} 10px 20px);
    border: ${t('line-1')} solid ${t('border-frame')};
  }

  .loupe-cross,
  .loupe-ring {
    fill: none;
    stroke: ${t('gray-9')};
    vector-effect: non-scaling-stroke;
  }

  .checks,
  .keys {
    display: grid;
    grid-template-columns: 1fr auto;
    margin: 0;
    padding: ${t('space-2')} ${t('space-4')};
    font-size: ${t('text-label-size')};
  }

  .checks dt,
  .checks dd {
    padding-block: ${t('space-2')};
    border-block-end: ${t('line-1')} dotted ${t('border-divider')};
  }

  .checks dt {
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: ${t('text-label')};
  }

  dd {
    margin: 0;
  }

  .keys {
    grid-template-columns: auto 1fr;
    gap: ${t('space-3')};
  }

  kbd {
    display: inline-block;
    min-inline-size: 36px;
    padding: 2px 6px;
    font-family: inherit;
    font-size: ${t('text-micro')};
    border: ${t('line-1')} solid ${t('border-control')};
  }

  /* Mobil (R7): Karte „Foto ausrichten“ unter dem Foto auf dem Tisch. */
  .mobile .photo-view {
    touch-action: none;
  }

  .mobile .loupe-box {
    inline-size: 128px;
  }

  .photo-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: ${t('space-3')};
    min-block-size: 48px;
    padding-inline: ${t('space-4')};
  }

  .photo-actions {
    display: flex;
    gap: ${t('space-4')};
  }

  .sheet-block {
    display: flex;
    flex-direction: column;
    gap: ${t('space-2')};
    padding: ${t('space-3')} ${t('space-4')} ${t('space-4')};
  }

  .field-label .value {
    color: ${t('text-highlight')};
  }

  .format-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .format-tabs {
    display: flex;
    gap: ${t('space-4')};
  }

  .format-tab {
    all: unset;
    box-sizing: border-box;
    min-block-size: ${t('hit')};
    font-size: ${t('text-micro')};
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: ${t('text-label')};
    border-block-end: 2px solid transparent;
    cursor: pointer;
  }

  .format-tab[aria-pressed='true'] {
    font-weight: 700;
    color: ${t('text-highlight')};
    border-block-end-color: ${t('text-highlight')};
  }

  .format-tab:focus-visible {
    outline: ${t('line-2')} dashed ${t('border-focus')};
  }

  .sheet-block .hint {
    font-size: ${t('text-label-size')};
    letter-spacing: 0.06em;
    color: ${t('text-secondary')};
  }

  .sheet-block .apply {
    display: flex;
    margin-block-start: auto;
    padding: 0 18px;
    border: ${t('line-1')} solid ${t('fill-active')};
  }

  .sheet-block .apply:disabled {
    border: ${t('line-1')} dotted ${t('border-divider')};
  }
`;
