import { html, svg, type SVGTemplateResult, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { BaseElement } from '../../internal/base-element.js';
import { uiMsg } from '../../i18n/ui-messages.js';
import { part } from '../../internal/part.js';
import { legendStyles } from './legend.styles.js';

type LegendKey = 'border' | 'valley' | 'mountain' | 'flat' | 'selected' | 'snap';

const ENTRIES: readonly LegendKey[] = ['border', 'valley', 'mountain', 'flat', 'selected', 'snap'];

/**
 * Legende der Faltlinien (C09). Die Strichmuster kommen aus denselben Tokens,
 * mit denen die 2D-Zeichenflaeche Linien zeichnet.
 *
 * @csspart list - Die Liste der Eintraege.
 */
export class Legend extends BaseElement {
  static override styles = [BaseElement.styles, legendStyles];

  /** Ohne Wert die Vorgabe der aktuellen Sprache. */
  @property({ reflect: true })
  label = '';

  #renderSample(key: LegendKey): SVGTemplateResult {
    if (key === 'snap') {
      return svg`<circle class="snap" cx="5" cy="6" r="4.5"></circle>
        <path class="snap" d="M22 2 V10 M18 6 H26"></path>`;
    }
    if (key === 'selected') {
      return svg`<line class="line selected" x1="4" y1="6" x2="48" y2="6"></line>
        <rect class="handle" x="0.75" y="2.25" width="7.5" height="7.5"></rect>
        <rect class="handle" x="43.75" y="2.25" width="7.5" height="7.5"></rect>`;
    }
    return svg`<line class="line ${key}" x1="0" y1="6" x2="52" y2="6"></line>`;
  }

  protected override render(): TemplateResult {
    return html`
      <ul class="list" part=${part('list')} aria-label=${this.label || uiMsg().legendLabel}>
        ${ENTRIES.map(
          (key) => html`
            <li class="entry ${key}">
              <svg class="sample" viewBox="0 0 52 12" aria-hidden="true">
                ${this.#renderSample(key)}
              </svg>
              ${uiMsg().legend[key]}
            </li>
          `,
        )}
      </ul>
    `;
  }
}
