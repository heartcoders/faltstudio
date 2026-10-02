import { html, type PropertyValues, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { BaseElement } from '../../internal/base-element.js';
import { boolProp, checkEnum, enumProp } from '../../internal/enum-prop.js';
import { DEV } from '../../internal/dev.js';
import { emit } from '../../internal/emit.js';
import { part } from '../../internal/part.js';
import { segmentedStyles } from './segmented.styles.js';
import type { Segment } from './segment.js';

export const ORIENTATIONS = ['horizontal', 'vertical'] as const;
export type Orientation = (typeof ORIENTATIONS)[number];

const NEXT_KEYS: Readonly<Record<string, number>> = {
  ArrowRight: 1,
  ArrowDown: 1,
  ArrowLeft: -1,
  ArrowUp: -1,
};

/**
 * Segmented Control (C02): Modus-Umschalter, Tal/Berg, Zielformat.
 * Radiogroup mit Roving Tabindex; Pfeiltasten wechseln und waehlen.
 *
 * @slot - `<fl-segment>`-Elemente.
 * @fires change - detail: der neue `value`.
 * @csspart group - Der Rahmen um alle Segmente.
 */
export class Segmented extends BaseElement {
  static override styles = [BaseElement.styles, segmentedStyles];

  @property({ reflect: true })
  value = '';

  /** Zugaenglicher Name der Gruppe, z.B. "Modus". */
  @property({ reflect: true })
  label = '';

  /** Segmente teilen sich die Breite gleichmaessig (Formularfelder). */
  @boolProp()
  fill = false;

  /** Ohne Aussenrahmen, wenn die Umgebung schon begrenzt (Werkzeugleiste). */
  @boolProp()
  bare = false;

  /** Vertikal fuer Werkzeugleisten: Segmente untereinander, Nummer ueber dem Label. */
  @enumProp(ORIENTATIONS, 'horizontal')
  orientation: Orientation = 'horizontal';

  get #segments(): readonly Segment[] {
    return [...this.querySelectorAll<Segment>(':scope > fl-segment')];
  }

  protected override willUpdate(): void {
    if (DEV) checkEnum(ORIENTATIONS, this.orientation, 'orientation', this.warn.bind(this));
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (changed.has('value') || changed.has('orientation')) this.#syncSelection();
  }

  #syncSelection(): void {
    for (const segment of this.#segments) {
      segment.selected = segment.value === this.value;
      segment.vertical = this.orientation === 'vertical';
    }
  }

  #choose(value: string): void {
    if (value === this.value) return;
    this.value = value;
    emit(this, 'change', value);
  }

  #onSelect(event: CustomEvent<string>): void {
    event.stopPropagation();
    this.#choose(event.detail);
  }

  #onKeydown(event: KeyboardEvent): void {
    const step = NEXT_KEYS[event.key];
    if (step === undefined) return;
    event.preventDefault();
    const enabled = this.#segments.filter((segment) => !segment.disabled);
    const current = enabled.findIndex((segment) => segment.value === this.value);
    const target = enabled.at((current + step) % enabled.length);
    if (!target) return;
    this.#choose(target.value);
    void this.updateComplete.then(() => target.focus());
  }

  protected override render(): TemplateResult {
    return html`
      <div
        class="group ${this.fill ? 'fill' : ''} ${this.bare ? 'bare' : ''} ${this.orientation}"
        part=${part('group')}
        role="radiogroup"
        aria-label=${this.label}
        aria-orientation=${this.orientation}
        @select=${this.#onSelect}
        @keydown=${this.#onKeydown}
      >
        <slot @slotchange=${this.#syncSelection}></slot>
      </div>
    `;
  }
}
