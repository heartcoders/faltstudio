import { html, type TemplateResult } from 'lit';
import { BaseElement } from '../../internal/base-element.js';
import { boolProp } from '../../internal/enum-prop.js';
import { emit } from '../../internal/emit.js';
import { part } from '../../internal/part.js';
import { checkboxStyles } from './checkbox.styles.js';

/**
 * Checkbox im Plan-Stil: gefuelltes Quadrat = an, Rahmen = aus.
 * Die ganze Zeile ist Trefferflaeche (min. 44 px).
 *
 * @slot - Das Label.
 * @fires change - detail: neuer `checked`-Zustand.
 * @csspart row - Das <label> mit Kaestchen und Text.
 */
export class Checkbox extends BaseElement {
  static override styles = [BaseElement.styles, checkboxStyles];

  @boolProp()
  checked = false;

  @boolProp()
  disabled = false;

  #onChange(event: Event): void {
    event.stopPropagation();
    this.checked = (event.target as HTMLInputElement).checked;
    emit(this, 'change', this.checked);
  }

  protected override render(): TemplateResult {
    return html`
      <label class="row" part=${part('row')}>
        <input
          type="checkbox"
          .checked=${this.checked}
          ?disabled=${this.disabled}
          @change=${this.#onChange}
        />
        <span class="label"><slot></slot></span>
      </label>
    `;
  }
}
