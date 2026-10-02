import { html, nothing, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { BaseElement } from '../../internal/base-element.js';
import { uiMsg } from '../../i18n/ui-messages.js';
import { boolProp, numberProp } from '../../internal/enum-prop.js';
import { emit } from '../../internal/emit.js';
import { part } from '../../internal/part.js';
import { stepTrackStyles } from './step-track.styles.js';

/**
 * Fortschritt ueber alle Schritte als Bemassungslinie mit Schrittmarken.
 * `position` ist kontinuierlich: 2.55 = Schritt 3 zu 55 % gefaltet.
 * Mit `scrub` wird daraus die ziehbare Zeitleiste der Editor-Vorschau.
 *
 * @fires input - Nur mit `scrub`, detail: neue Position.
 * @csspart track - Die Leiste.
 */
export class StepTrack extends BaseElement {
  static override styles = [BaseElement.styles, stepTrackStyles];

  @numberProp({ min: 1, max: 99, fallback: 8 })
  steps = 8;

  @numberProp({ min: 0, fallback: 0 })
  position = 0;

  @boolProp()
  scrub = false;

  /** Ohne Schrittnummern, wenn die Umgebung sie schon mit Titeln zeigt. */
  @boolProp()
  unlabeled = false;

  /** Ohne Wert die Vorgabe der aktuellen Sprache. */
  @property({ reflect: true })
  label = '';

  get #clamped(): number {
    return Math.min(this.steps, Math.max(0, this.position));
  }

  #onInput(event: Event): void {
    event.stopPropagation();
    this.position = Number((event.target as HTMLInputElement).value);
    emit(this, 'input', this.position);
  }

  #renderCells(): TemplateResult[] {
    const reached = Math.ceil(this.#clamped);
    return Array.from({ length: this.steps }, (_, index) => {
      const number = String(index + 1).padStart(2, '0');
      return html`<span class="cell ${index < reached ? 'reached' : ''}"
        >${this.unlabeled ? '' : number}</span
      >`;
    });
  }

  #renderInput(): TemplateResult | typeof nothing {
    if (!this.scrub) return nothing;
    return html`<input
      type="range"
      min="0"
      max=${this.steps}
      step="0.01"
      .value=${String(this.#clamped)}
      aria-label=${this.label || uiMsg().progressLabel}
      aria-valuetext=${this.#valueText()}
      @input=${this.#onInput}
    />`;
  }

  #valueText(): string {
    const step = Math.min(this.steps, Math.floor(this.#clamped) + 1);
    const percent = Math.round((this.#clamped % 1) * 100);
    return uiMsg().progressValue(step, this.steps, percent);
  }

  protected override render(): TemplateResult {
    const ratio = styleMap({
      '--ratio': String(this.#clamped / this.steps),
      '--steps': String(this.steps),
    });
    return html`
      <span
        class="track"
        part=${part('track')}
        style=${ratio}
        role=${this.scrub ? nothing : 'progressbar'}
        aria-label=${this.scrub ? nothing : this.label || uiMsg().progressLabel}
        aria-valuemin=${this.scrub ? nothing : 0}
        aria-valuemax=${this.scrub ? nothing : this.steps}
        aria-valuenow=${this.scrub ? nothing : this.#clamped}
        aria-valuetext=${this.scrub ? nothing : this.#valueText()}
      >
        ${this.#renderCells()} ${this.#renderInput()}
      </span>
    `;
  }
}
