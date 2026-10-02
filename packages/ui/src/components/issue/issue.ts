import { html, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { BaseElement } from '../../internal/base-element.js';
import { checkEnum, enumProp } from '../../internal/enum-prop.js';
import { DEV } from '../../internal/dev.js';
import { part } from '../../internal/part.js';
import { uiMsg } from '../../i18n/ui-messages.js';
import { issueStyles } from './issue.styles.js';

export const SEVERITIES = ['error', 'warning', 'ok'] as const;
export type Severity = (typeof SEVERITIES)[number];

/**
 * Warnungszeile (C06). Fehler = gefuellte Marke, Warnung = Rahmen durchgezogen,
 * OK = Rahmen gepunktet. Die Schwere steht zusaetzlich als Text fuer Screenreader.
 *
 * @slot - Beschreibung.
 * @slot action - Optionale Aktion, z.B. `<fl-button>Zeigen</fl-button>`.
 * @csspart row - Die gesamte Zeile.
 */
export class Issue extends BaseElement {
  static override styles = [BaseElement.styles, issueStyles];

  @enumProp(SEVERITIES, 'warning')
  severity: Severity = 'warning';

  /** Kennung in der Marke, z.B. "E1". Bei OK steht "OK". */
  @property({ reflect: true })
  code = '';

  @property({ reflect: true })
  heading = '';

  protected override willUpdate(): void {
    if (DEV) checkEnum(SEVERITIES, this.severity, 'severity', this.warn.bind(this));
  }

  protected override render(): TemplateResult {
    const mark = this.severity === 'ok' ? 'OK' : this.code;
    return html`
      <div class="row severity-${this.severity}" part=${part('row')}>
        <span class="mark" aria-hidden="true">${mark}</span>
        <p class="body">
          <span class="sr"
            >${uiMsg().severity[this.severity]}${this.code ? ` ${this.code}` : ''}:</span
          >
          ${this.heading ? html`<b class="heading">${this.heading}</b>` : ''}
          <span class="text"><slot></slot></span>
        </p>
        <slot name="action"></slot>
      </div>
    `;
  }
}
