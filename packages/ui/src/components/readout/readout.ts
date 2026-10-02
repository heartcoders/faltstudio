import { html, nothing, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { BaseElement } from '../../internal/base-element.js';
import { part } from '../../internal/part.js';
import { readoutStyles } from './readout.styles.js';

/**
 * Koordinaten-Tooltip (C07): drei Zeilen in abnehmender Helligkeit.
 * Positioniert wird vom Aufrufer; die Komponente ist nur die Box.
 *
 * @csspart box - Der Rahmen.
 */
export class Readout extends BaseElement {
  static override styles = [BaseElement.styles, readoutStyles];

  /** Hauptzeile, z.B. "X 105.0 · Y 148.5 mm". */
  @property({ reflect: true })
  primary = '';

  /** Zweite Zeile, z.B. "∠ 45.0° · L 148.5 mm". */
  @property({ reflect: true })
  secondary = '';

  /** Dritte Zeile, z.B. "Snap · Mitte". */
  @property({ reflect: true })
  hint = '';

  protected override render(): TemplateResult {
    return html`
      <output class="box" part=${part('box')}>
        <span class="primary">${this.primary}</span>
        ${this.secondary ? html`<span class="secondary">${this.secondary}</span>` : nothing}
        ${this.hint ? html`<span class="hint">${this.hint}</span>` : nothing}
      </output>
    `;
  }
}
