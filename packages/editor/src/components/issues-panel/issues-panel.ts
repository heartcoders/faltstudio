import { html, nothing, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { BaseElement, boolProp, emit } from '@faltstudio/ui';
import type { Editor } from '../../state/editor.js';
import { collectIssues, type EditorIssue } from '../../state/issues.js';
import { StoreController } from '../../state/store-controller.js';
import { issuesPanelStyles, issuesSheetStyles } from './issues-panel.styles.js';
import { common } from '../../i18n/common.js';
import { stepsText } from '../../i18n/steps.js';

/**
 * Alle Befunde als aufklappbare Liste unter dem Zaehler im Kopf. "Zeigen" waehlt
 * die Linien bzw. den Schritt aus und meldet, welcher Modus dafuer noetig ist.
 *
 * Mit `sheet` als mobile Karte (Redesign R8): grosse Umriss-Ziffer, alle
 * Vorschlaege auf einmal, Eintraege mit Textaktionen.
 *
 * @fires navigate - detail: 'lines' | 'steps'.
 * @fires close - Liste schliessen.
 */
export class IssuesPanel extends BaseElement {
  static override styles = [BaseElement.styles, issuesPanelStyles, issuesSheetStyles];

  @property({ attribute: false }) editor!: Editor;
  @boolProp() sheet = false;
  #observed = false;

  override connectedCallback(): void {
    super.connectedCallback();
    if (this.#observed) return;
    this.#observed = true;
    new StoreController(this, this.editor.document);
  }

  #show(issue: EditorIssue): void {
    const target = issue.target;
    if (!target) return;
    if (target.kind === 'lines') {
      this.editor.select(target.creaseIds);
      emit(this, 'navigate', 'lines');
      return;
    }
    this.editor.steps.select(target.stepIndex);
    emit(this, 'navigate', 'steps');
  }

  #renderIssue(issue: EditorIssue, code: string): TemplateResult {
    return html`
      <li>
        <fl-issue severity=${issue.severity} code=${code} heading=${issue.title}>
          ${issue.message}
          ${
            issue.fix
              ? html`<fl-button slot="action" size="small" @click=${() => issue.fix?.run()}
                  >${issue.fix.label}</fl-button
                >`
              : issue.target
                ? html`<fl-button slot="action" size="small" @click=${() => this.#show(issue)}
                    >${common().show}</fl-button
                  >`
                : nothing
          }
        </fl-issue>
      </li>
    `;
  }

  #renderSheetIssue(issue: EditorIssue): TemplateResult {
    const error = issue.severity === 'error';
    return html`
      <li class="entry">
        <span
          class=${error ? 'mark error' : 'mark'}
          aria-label=${error ? stepsText().issues.error : stepsText().issues.warning}
          >${error ? '✕' : '!'}</span
        >
        <div class="entry-body">
          <h3 class="entry-title">${issue.title}</h3>
          <p class="entry-text">${issue.message}</p>
          <div class="entry-actions">
            ${issue.fix ? html`<button class="text-action strong" type="button" @click=${() => issue.fix?.run()}>${issue.fix.label}</button>` : nothing}
            ${issue.target ? html`<button class="text-action" type="button" @click=${() => this.#show(issue)}>${issue.fix ? common().show : stepsText().issues.showOnSheet}</button>` : nothing}
          </div>
        </div>
      </li>
    `;
  }

  #renderSheet(issues: readonly EditorIssue[]): TemplateResult {
    const fixable = issues.filter((issue) => issue.fix).length;
    const groups = ['pattern-', 'step-', 'kind-'];
    const passed = groups.filter(
      (prefix) => !issues.some((issue) => issue.key.startsWith(prefix)),
    ).length;
    return html`
      <section class="card" aria-label=${stepsText().issues.heading}>
        <header class="card-head">
          <h2 class="card-heading">
            <span class="count" aria-hidden="true">${String(issues.length).padStart(2, '0')}</span>
            <span>${stepsText().issues.heading}</span>
          </h2>
          <button
            class="close"
            type="button"
            aria-label=${common().close}
            @click=${() => emit(this, 'close')}
          >
            ✕
          </button>
        </header>
        ${
          fixable > 0
            ? html`<button
                class="adopt"
                type="button"
                @click=${() => this.editor.steps.adoptFinalKinds()}
              >
                <span>${stepsText().issues.adoptAll}</span><span>${fixable}</span>
              </button>`
            : nothing
        }
        <ul class="entries">
          ${issues.map((issue) => this.#renderSheetIssue(issue))}
        </ul>
        <p class="passed">${stepsText().issues.passed(passed)}</p>
      </section>
    `;
  }

  protected override render(): TemplateResult {
    const issues = collectIssues(this.editor);
    if (this.sheet) return this.#renderSheet(issues);
    let errors = 0;
    let warnings = 0;
    const adoptable = this.editor.steps.kindMismatches.some(
      (mismatch) => mismatch.folded !== 'unfolded',
    );
    return html`
      <section class="panel" aria-label=${stepsText().issues.heading}>
        <header class="head">
          <h2>${stepsText().issues.heading}</h2>
          ${adoptable ? html`<fl-button size="small" @click=${() => this.editor.steps.adoptFinalKinds()}>${stepsText().issues.adoptAllKinds}</fl-button>` : nothing}
          <fl-button
            square
            size="small"
            accessibility-label=${common().close}
            @click=${() => emit(this, 'close')}
            >×</fl-button
          >
        </header>
        <ul class="list">
          ${issues.map((issue) => this.#renderIssue(issue, issue.severity === 'error' ? `E${++errors}` : `W${++warnings}`))}
          ${issues.length === 0 ? html`<li><fl-issue severity="ok">${stepsText().issues.none}</fl-issue></li>` : nothing}
        </ul>
      </section>
    `;
  }
}
