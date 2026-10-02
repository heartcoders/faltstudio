import { css } from 'lit';
import { t } from '@faltstudio/ui';

export const creaseCanvasStyles = css`
  :host {
    display: block;
    min-block-size: 0;
  }

  .canvas {
    display: block;
    inline-size: 100%;
    block-size: 100%;
    overflow: visible;
    font-family: ${t('font-mono')};
  }

  /* Gezoomt: nichts ueber die Flaeche hinaus zeichnen. */
  .canvas.zoomed {
    overflow: hidden;
  }

  .canvas.zoomed :is(line, path, rect, polygon, circle) {
    vector-effect: non-scaling-stroke;
  }

  .canvas.interactive {
    cursor: crosshair;
    touch-action: none;
  }

  .loupe-stem {
    stroke: ${t('text-secondary')};
    stroke-width: 1;
    stroke-dasharray: 1 3;
    vector-effect: non-scaling-stroke;
  }

  .loupe-finger {
    fill: none;
    stroke: ${t('text-label')};
    stroke-width: 1;
    stroke-dasharray: 2 3;
    vector-effect: non-scaling-stroke;
  }

  .loupe-ring {
    fill: rgb(11 11 11 / 0.55);
    stroke: ${t('text-highlight')};
    stroke-width: 1.5;
    vector-effect: non-scaling-stroke;
  }

  .draft {
    stroke: ${t('ink-strong')};
    stroke-width: 2;
    stroke-dasharray: ${t('dash-suggest')};
    pointer-events: none;
  }

  .guide {
    fill: none;
    stroke: ${t('gray-6')};
    stroke-width: 0.75;
    stroke-dasharray: 2 3;
    pointer-events: none;
  }

  .cursor,
  .cursor-cross {
    fill: none;
    stroke: ${t('ink-strong')};
    stroke-width: 1;
    pointer-events: none;
  }

  .cursor.snapped {
    stroke-width: 2;
  }

  .tip {
    fill: ${t('fill')};
    stroke: ${t('gray-7')};
    pointer-events: none;
  }

  .tip-text {
    fill: ${t('text-secondary')};
    font-size: 11px;
    text-transform: uppercase;
    pointer-events: none;
  }

  .tip-text.primary {
    fill: ${t('text-highlight')};
  }

  /* Redesign „Tisch & Papier“: hellgraues Blatt mit Schatten auf schwarzem Tisch. */
  .sheet {
    fill: ${t('paper')};
  }

  .shadow {
    fill: ${t('ink-strong')};
    opacity: 0.9;
  }

  .paper-grid {
    stroke: ${t('paper-grid')};
    stroke-width: 0.5;
    pointer-events: none;
  }

  .paper-grid.major {
    stroke: ${t('paper-grid-major')};
  }

  .border {
    fill: none;
    stroke: none;
  }

  .face {
    fill: url(#hatch);
    opacity: 0.55;
  }

  .mini .face {
    opacity: 0.8;
  }

  .hatch {
    stroke: ${t('ink-flat')};
    stroke-width: 1;
  }

  .crease {
    stroke: ${t('ink-soft')};
    stroke-width: 1.25;
  }

  .crease.border {
    stroke: ${t('ink-flat')};
    stroke-width: 0.75;
  }

  .crease.valley {
    stroke-dasharray: ${t('dash-valley')};
  }

  .crease.mountain {
    stroke-dasharray: ${t('dash-mountain')};
  }

  .crease.flat {
    stroke: ${t('ink-flat')};
    stroke-width: 1;
    stroke-dasharray: ${t('dash-flat')};
  }

  .crease.dimmed {
    stroke: ${t('paper-back')};
  }

  .crease.selected {
    stroke: ${t('ink-strong')};
    stroke-width: 2.5;
    stroke-dasharray: none;
  }

  .crease.off {
    stroke: ${t('ink-flat')};
    stroke-width: 0.75;
  }

  .crease.on {
    stroke: ${t('ink-strong')};
    stroke-width: 1.5;
  }

  /*
   * Mini-Blaetter werden stark hochskaliert (Startseite, Schrittkarten). Strich
   * und Muster in Bildschirmpixeln, sonst wachsen sie mit und wirken klobig.
   */
  .mini .crease {
    vector-effect: non-scaling-stroke;
    stroke-linecap: round;
  }

  .mini .crease.on {
    stroke: ${t('ink')};
    stroke-width: 1;
  }

  .mini .crease.off {
    stroke-width: 0.75;
  }

  .mini .crease.on.valley {
    stroke-dasharray: 4 3;
  }

  .mini .crease.on.mountain {
    stroke-dasharray: 7 3 1 3;
  }

  .axis {
    stroke: ${t('ink-soft')};
    stroke-width: 0.75;
    stroke-dasharray: 14 4 2 4;
  }

  .suggest {
    stroke: ${t('ink-strong')};
    stroke-width: 2;
    stroke-dasharray: ${t('dash-suggest')};
  }

  .line-label {
    fill: ${t('ink-soft')};
    font-size: 9px;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  .snap {
    fill: ${t('paper')};
    stroke: ${t('gray-5')};
    stroke-width: 1;
  }

  .snap-cross {
    fill: none;
    stroke: ${t('ink-soft')};
    stroke-width: 1;
  }

  .dimension {
    fill: none;
  }

  .dimension {
    stroke: ${t('gray-6')};
    stroke-width: 0.75;
  }

  .dimension-gap {
    fill: ${t('fill')};
  }

  .dimension-text {
    fill: ${t('text')};
    font-size: 10px;
    text-anchor: middle;
  }

  .handle {
    fill: ${t('paper')};
    stroke: ${t('ink-strong')};
    stroke-width: 1.25;
  }

  .tag {
    fill: ${t('gray-9')};
    stroke: ${t('ink-strong')};
  }

  .tag.outline {
    fill: ${t('gray-0')};
    stroke: ${t('gray-9')};
  }

  .tag-text {
    fill: ${t('gray-0')};
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1px;
  }

  .tag-text.outline {
    fill: ${t('gray-9')};
  }
`;
