import { html, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { BaseElement } from '../../internal/base-element.js';
import { boolProp } from '../../internal/enum-prop.js';
import { emit } from '../../internal/emit.js';
import { part } from '../../internal/part.js';
import { textFieldStyles } from './text-field.styles.js';

/**
 * Textfeld mit Plan-Label ("01 · Titel"). Label und Feld liegen in derselben
 * Shadow Root, weil `for` pro Baum aufgeloest wird.
 *
 * @fires input - Bei jeder Eingabe, detail: aktueller Wert.
 * @fires change - Beim Verlassen, detail: finaler Wert.
 * @csspart field - Das <input> bzw. <textarea>.
 */
export class TextField extends BaseElement {
  static override styles = [BaseElement.styles, textFieldStyles];

  @property({ reflect: true })
  label = '';

  /** Nummer vor dem Label, z.B. "01". */
  @property({ reflect: true })
  index = '';

  /** Aktueller Wert. Reflektiert bewusst nicht, wie beim nativen <input>. */
  @property()
  value = '';

  @boolProp()
  multiline = false;

  #read(event: Event): string {
    return (event.target as HTMLInputElement | HTMLTextAreaElement).value;
  }

  #onInput(event: Event): void {
    event.stopPropagation();
    this.value = this.#read(event);
    emit(this, 'input', this.value);
  }

  #onChange(event: Event): void {
    this.value = this.#read(event);
    emit(this, 'change', this.value);
  }

  #renderField(): TemplateResult {
    if (this.multiline) {
      return html`<textarea
        id="field"
        class="field"
        part=${part('field')}
        rows="3"
        .value=${this.value}
        @input=${this.#onInput}
        @change=${this.#onChange}
      ></textarea>`;
    }
    return html`<input
      id="field"
      class="field"
      part=${part('field')}
      .value=${this.value}
      @input=${this.#onInput}
      @change=${this.#onChange}
    />`;
  }

  protected override render(): TemplateResult {
    return html`
      <span class="text-field">
        <label for="field">${this.index ? `${this.index} · ` : ''}${this.label}</label>
        ${this.#renderField()}
      </span>
    `;
  }
}
