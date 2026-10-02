import { html, nothing, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { BaseElement, boolProp, emit, numberProp } from '@faltstudio/ui';
import { EDITOR_MODES, type EditorMode } from '../editor-app/modes.js';
import { editorText } from '../../i18n/editor.js';
import { HOME_HREF } from '../../state/route.js';
import { editorHeaderStyles } from './editor-header.styles.js';

/**
 * Kopfzeile des Editors (Redesign D2, ohne Kaesten): zurueck zur Uebersicht,
 * Name und Status, mittig die Modi als unterstrichene Reiter, rechts die
 * Befund-Zaehler, das Dateimenue und „Fertig“.
 *
 * @fires modechange - detail: der gewaehlte Modus.
 * @fires issues - Befundliste ein- oder ausklappen.
 * @fires done - Fertig-Sheet oeffnen.
 */
export class EditorHeader extends BaseElement {
  static override styles = [BaseElement.styles, editorHeaderStyles];

  @property() mode: EditorMode = 'lines';
  @property() document = '';
  @property() status = '';
  @numberProp({ min: 0, fallback: 0 }) errors = 0;
  @numberProp({ min: 0, fallback: 0 }) warnings = 0;
  @boolProp({ attribute: 'issues-open' }) issuesOpen = false;

  #renderIssues(): TemplateResult {
    const total = this.errors + this.warnings;
    return html`
      <button
        class="issues"
        type="button"
        aria-label=${editorText().issuesLabel(this.errors, this.warnings)}
        aria-expanded=${this.issuesOpen ? 'true' : 'false'}
        @click=${() => emit(this, 'issues')}
      >
        ${total === 0 ? html`<span class="ok">✓ OK</span>` : nothing}
        ${this.errors > 0 ? html`<span class="error">✕ ${this.errors}</span>` : nothing}
        ${this.warnings > 0 ? html`<span class="warning">! ${this.warnings}</span>` : nothing}
      </button>
    `;
  }

  #renderModes(): TemplateResult {
    return html`
      <nav class="modes" aria-label=${editorText().modesLabel}>
        ${EDITOR_MODES.map(
          (mode) =>
            html`<button
              class="mode"
              type="button"
              aria-current=${mode === this.mode ? 'page' : 'false'}
              @click=${() => mode !== this.mode && emit(this, 'modechange', mode)}
            >
              ${editorText().modes[mode]}
            </button>`,
        )}
      </nav>
    `;
  }

  protected override render(): TemplateResult {
    const msg = editorText();
    return html`
      <header class="header">
        <div class="file">
          <a class="back" href=${HOME_HREF} aria-label=${msg.backToOverview}>←</a>
          <p class="name-block">
            <span class="name" title=${this.document}>${this.document}</span>
            <span class="status" role="status">${this.status}</span>
          </p>
        </div>
        ${this.#renderModes()} ${this.#renderIssues()}
        <fl-file-menu></fl-file-menu>
        <button class="text-action strong" type="button" @click=${() => emit(this, 'done')}>
          ${msg.done}
        </button>
      </header>
    `;
  }
}
