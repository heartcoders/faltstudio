import { html, nothing, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { BaseElement } from '../../internal/base-element.js';
import { uiMsg } from '../../i18n/ui-messages.js';
import { boolProp, checkEnum, enumProp, numberProp } from '../../internal/enum-prop.js';
import { DEV } from '../../internal/dev.js';
import { part } from '../../internal/part.js';
import { stepCardStyles } from './step-card.styles.js';

export const FOLD_KINDS = ['valley', 'mountain'] as const;
export type FoldKind = (typeof FOLD_KINDS)[number];

/**
 * Schrittkarte (C05): Nummer, Faltart mit Winkel, Mini-Diagramm, Titel.
 * Zustaende Standard, Aktiv (`selected`) und Warnung (`warning="W1"`).
 *
 * @slot - Der Schritt-Titel.
 * @slot diagram - Mini-Diagramm, z.B. ein <svg> des Faltmusters.
 * @fires click - Nativ, zum Auswaehlen des Schritts.
 * @csspart control - Das gerenderte <button>.
 */
export class StepCard extends BaseElement {
  static override styles = [BaseElement.styles, stepCardStyles];

  @property({ reflect: true })
  index = '';

  @enumProp(FOLD_KINDS, 'valley')
  kind: FoldKind = 'valley';

  @numberProp({ min: 0, max: 180, fallback: 180 })
  angle = 180;

  @boolProp()
  selected = false;

  /** Schmale Karte fuer Mobil: Kopf und Diagramm, Titel nur fuer Screenreader. */
  @boolProp()
  compact = false;

  /** Kennung der Warnung, z.B. "W1". Leer = keine Warnung. */
  @property({ reflect: true })
  warning = '';

  protected override willUpdate(): void {
    if (DEV) checkEnum(FOLD_KINDS, this.kind, 'kind', this.warn.bind(this));
  }

  protected override render(): TemplateResult {
    const classes = classMap({ card: true, compact: this.compact, warning: this.warning !== '' });
    return html`
      <button
        class=${classes}
        part=${part('control')}
        type="button"
        aria-current=${this.selected ? 'step' : nothing}
      >
        <span class="head">
          <b class="index">${this.index}</b>
          <span>${uiMsg().foldKind[this.kind]}${this.compact ? '' : ` ${this.angle}°`}</span>
        </span>
        <span class="diagram"><slot name="diagram"></slot></span>
        <span class="title"><slot></slot></span>
        ${
          this.warning
            ? html`<span class="badge"
                >${this.warning}<span class="sr">${uiMsg().warning}</span></span
              >`
            : nothing
        }
      </button>
    `;
  }
}
