import { html, nothing, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { BaseElement } from '../../internal/base-element.js';
import { boolProp, numberProp } from '../../internal/enum-prop.js';
import { emit } from '../../internal/emit.js';
import { part } from '../../internal/part.js';
import { sliderStyles } from './slider.styles.js';

/**
 * Slider (C03): Skala alle 10 %, 24-px-Griff in 44-px-Trefferflaeche.
 * Bedient wird ein unsichtbares natives <input type="range">, damit Tastatur,
 * Screenreader und Touch ohne eigenen Code funktionieren.
 *
 * @fires input - Waehrend des Ziehens, detail: aktueller Wert.
 * @fires change - Beim Loslassen, detail: finaler Wert.
 * @csspart track - Skala, Linie und Griff.
 */
export class Slider extends BaseElement {
  static override styles = [BaseElement.styles, sliderStyles];

  @numberProp({ fallback: 0 })
  value = 0;

  @numberProp({ fallback: 0 })
  min = 0;

  @numberProp({ fallback: 100 })
  max = 100;

  @numberProp({ min: 0, fallback: 1 })
  step = 1;

  @property({ reflect: true })
  label = '';

  /** Einheit fuer aria-valuetext und die Skalenbeschriftung, z.B. "%". */
  @property({ reflect: true })
  unit = '';

  /** Beschriftung 0 / Mitte / Max unter der Skala. */
  @boolProp()
  scale = false;

  @boolProp()
  disabled = false;

  get #ratio(): number {
    const span = this.max - this.min;
    if (span <= 0) return 0;
    return Math.min(1, Math.max(0, (this.value - this.min) / span));
  }

  #read(event: Event): number {
    return Number((event.target as HTMLInputElement).value);
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

  #renderScale(): TemplateResult | typeof nothing {
    if (!this.scale) return nothing;
    const mid = Math.round((this.min + this.max) / 2);
    return html`
      <span class="scale" aria-hidden="true">
        <span>${this.min}</span><span>${mid}</span><span>${this.max} ${this.unit}</span>
      </span>
    `;
  }

  protected override render(): TemplateResult {
    const position = styleMap({ '--ratio': String(this.#ratio) });
    return html`
      <span class="slider" style=${position}>
        <span class="track" part=${part('track')}>
          <input
            type="range"
            .value=${String(this.value)}
            min=${this.min}
            max=${this.max}
            step=${this.step}
            aria-label=${this.label}
            aria-valuetext=${`${this.value} ${this.unit}`.trim()}
            ?disabled=${this.disabled}
            @input=${this.#onInput}
            @change=${this.#onChange}
          />
        </span>
        ${this.#renderScale()}
      </span>
    `;
  }
}
