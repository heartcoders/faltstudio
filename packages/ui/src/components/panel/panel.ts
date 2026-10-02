import { html, nothing, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { BaseElement } from '../../internal/base-element.js';
import { boolProp, numberProp } from '../../internal/enum-prop.js';
import { part } from '../../internal/part.js';
import { panelStyles } from './panel.styles.js';

/**
 * Panel mit Kopf (C08): Kennbuchstabe, Titel, Meta. Optional mit Eckmarken
 * statt Rahmen, wie Legende oder Kamera-Info im Design.
 *
 * @slot - Inhalt.
 * @slot actions - Steuerelemente rechts im Kopf.
 * @csspart panel - Die <section>.
 * @csspart head - Der Kopf.
 */
export class Panel extends BaseElement {
  static override styles = [BaseElement.styles, panelStyles];

  /** Kennbuchstabe links im Kopf, z.B. "V". */
  @property({ reflect: true })
  letter = '';

  @property({ reflect: true })
  heading = '';

  @property({ reflect: true })
  meta = '';

  /** Ueberschriften-Ebene 2 bis 4, abhaengig von der Umgebung. */
  @numberProp({ min: 2, max: 4, fallback: 2 })
  level = 2;

  /** Eckmarken (10 px, G7) statt geschlossenem Rahmen. */
  @boolProp()
  marks = false;

  /** Panel fuellt die verfuegbare Hoehe und scrollt den Inhalt. */
  @boolProp()
  stretch = false;

  #renderHeading(): TemplateResult {
    if (this.level === 3) return html`<h3 class="title" id="title">${this.heading}</h3>`;
    if (this.level === 4) return html`<h4 class="title" id="title">${this.heading}</h4>`;
    return html`<h2 class="title" id="title">${this.heading}</h2>`;
  }

  protected override render(): TemplateResult {
    const classes = classMap({ panel: true, marks: this.marks, stretch: this.stretch });
    return html`
      <section class=${classes} part=${part('panel')} aria-labelledby="title">
        <header class="head" part=${part('head')}>
          ${this.letter ? html`<span class="letter" aria-hidden="true">${this.letter}</span>` : nothing}
          ${this.#renderHeading()}
          ${this.meta ? html`<span class="meta">${this.meta}</span>` : nothing}
          <slot name="actions"></slot>
        </header>
        <div class="content"><slot></slot></div>
      </section>
    `;
  }
}
