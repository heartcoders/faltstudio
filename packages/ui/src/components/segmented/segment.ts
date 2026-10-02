import { html, nothing, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { BaseElement } from '../../internal/base-element.js';
import { boolProp } from '../../internal/enum-prop.js';
import { emit } from '../../internal/emit.js';
import { part } from '../../internal/part.js';
import { segmentStyles } from './segmented.styles.js';

/**
 * Ein Feld eines `<fl-segmented>`. Die Auswahl verwaltet das Elternelement,
 * das Segment meldet nur `select` mit seinem Wert.
 *
 * @slot - Das Label.
 * @fires select - detail: der `value` dieses Segments.
 * @csspart control - Das gerenderte <button>.
 */
export class Segment extends BaseElement {
  static override styles = [BaseElement.styles, segmentStyles];

  @property({ reflect: true })
  value = '';

  /** Nummer vor dem Label, z.B. "02". Steht laut Design immer vorne. */
  @property({ reflect: true })
  index?: string;

  @boolProp()
  selected = false;

  @boolProp()
  disabled = false;

  /** Wird vom `<fl-segmented orientation="vertical">` gesetzt. */
  @boolProp()
  vertical = false;

  override focus(options?: FocusOptions): void {
    this.shadowRoot?.querySelector('button')?.focus(options);
  }

  #onClick(): void {
    if (this.disabled || this.selected) return;
    emit(this, 'select', this.value);
  }

  protected override render(): TemplateResult {
    return html`
      <button
        class=${this.vertical ? 'control vertical' : 'control'}
        part=${part('control')}
        type="button"
        role="radio"
        aria-checked=${this.selected ? 'true' : 'false'}
        tabindex=${this.selected ? 0 : -1}
        ?disabled=${this.disabled}
        @click=${this.#onClick}
      >
        ${this.index ? html`<span class="index">${this.index}</span>` : nothing}
        <span class="label"><slot></slot></span>
      </button>
    `;
  }
}
