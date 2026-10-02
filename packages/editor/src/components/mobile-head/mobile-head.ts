import { html, nothing, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { BaseElement, emit, numberProp } from '@faltstudio/ui';
import { EDITOR_MODES, type EditorMode } from '../editor-app/modes.js';
import { editorText } from '../../i18n/editor.js';
import { HOME_HREF } from '../../state/route.js';
import { mobileHeadStyles } from './mobile-head.styles.js';

/**
 * Kopf des Editors auf dem Handy (Redesign RHead): zurueck, Dateiname mit
 * Status, Befund-Chip, Menue; darunter die vier Modi als unterstrichene Reiter.
 * „Fertig“ liegt im Datei-Menue.
 *
 * @fires modechange - detail: Modus.
 * @fires issues - Befunde oeffnen.
 * @fires menu - Datei-Menue oeffnen.
 */
export class MobileHead extends BaseElement {
  static override styles = [BaseElement.styles, mobileHeadStyles];

  @property() mode: EditorMode = 'lines';
  @property() document = '';
  @property() status = '';
  @numberProp({ min: 0, fallback: 0 }) errors = 0;
  @numberProp({ min: 0, fallback: 0 }) warnings = 0;

  #renderIssues(): TemplateResult {
    if (this.errors + this.warnings === 0) {
      return html`<button
        class="issues ok"
        type="button"
        aria-label=${editorText().issuesLabel(0, 0)}
        @click=${() => emit(this, 'issues')}
      >
        ✓ OK
      </button>`;
    }
    return html`
      <button
        class="issues"
        type="button"
        aria-label=${editorText().issuesLabel(this.errors, this.warnings)}
        @click=${() => emit(this, 'issues')}
      >
        ${this.errors > 0 ? html`<span class="error">✕ ${this.errors}</span>` : nothing}
        ${this.warnings > 0 ? html`<span class="warning">! ${this.warnings}</span>` : nothing}
      </button>
    `;
  }

  protected override render(): TemplateResult {
    const msg = editorText();
    return html`
      <header class="head">
        <div class="row">
          <a class="square" href=${HOME_HREF} aria-label=${msg.backToOverview}>←</a>
          <p class="file">
            <span class="name">${this.document}</span><span class="sub">${this.status}</span>
          </p>
          ${this.#renderIssues()}
          <button
            class="square"
            type="button"
            aria-label=${msg.fileMenuButton}
            @click=${() => emit(this, 'menu')}
          >
            ⋯
          </button>
        </div>
        <nav class="modes" aria-label=${msg.modesLabel}>
          ${EDITOR_MODES.map(
            (mode) =>
              html`<button
                class="mode"
                type="button"
                aria-pressed=${mode === this.mode ? 'true' : 'false'}
                @click=${() => mode !== this.mode && emit(this, 'modechange', mode)}
              >
                ${msg.modes[mode]}
              </button>`,
          )}
        </nav>
      </header>
    `;
  }
}
