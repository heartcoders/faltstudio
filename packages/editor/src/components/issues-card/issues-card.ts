import { html, nothing, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { BaseElement, emit } from '@faltstudio/ui';
import type { Editor } from '../../state/editor.js';
import { collectIssues, type EditorIssue } from '../../state/issues.js';
import { StoreController } from '../../state/store-controller.js';
import { issuesCardStyles } from './issues-card.styles.js';
import { common } from '../../i18n/common.js';
import { stepsText } from '../../i18n/steps.js';

const MAX_ROWS = 3;

/**
 * Dunkle Befund-Karte unten rechts auf dem Tisch (Redesign D2): Zaehler und
 * die ersten Befunde mit „Zeigen“ oder der direkten Korrektur. Abweichende
 * Linienarten werden zu einer Zeile mit „Alle übernehmen“ zusammengefasst.
 *
 * @fires navigate - detail: 'lines' | 'steps', nach „Zeigen“.
 * @fires issues - die vollstaendige Befundliste oeffnen.
 */
export class IssuesCard extends BaseElement {
  static override styles = [BaseElement.styles, issuesCardStyles];

  @property({ attribute: false }) editor!: Editor;
  #observed = false;

  override connectedCallback(): void {
    super.connectedCallback();
    if (this.#observed) return;
    this.#observed = true;
    new StoreController(this, this.editor.document);
  }

  #handleShow(issue: EditorIssue): void {
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

  #renderMark(severity: EditorIssue['severity']): TemplateResult {
    return html`<span class="mark ${severity}" aria-hidden="true"
      >${severity === 'error' ? '✕' : '!'}</span
    >`;
  }

  #renderIssue(issue: EditorIssue): TemplateResult {
    const action = issue.fix
      ? html`<button class="text-action strong" type="button" @click=${() => issue.fix?.run()}>
          ${issue.fix.label}
        </button>`
      : issue.target
        ? html`<button class="text-action" type="button" @click=${() => this.#handleShow(issue)}>
            ${common().show}
          </button>`
        : nothing;
    return html`<li class="row">
      ${this.#renderMark(issue.severity)}
      <p class="text"><b>${issue.title}</b> ${issue.message}</p>
      ${action}
    </li>`;
  }

  #renderAdoptAll(count: number): TemplateResult {
    const differ = stepsText().issues.kindsDiffer(count);
    return html`<li class="row">
      ${this.#renderMark('warning')}
      <p class="text"><b>${differ.subject}</b> ${differ.rest}</p>
      <button
        class="text-action strong"
        type="button"
        @click=${() => this.editor.steps.adoptFinalKinds()}
      >
        ${stepsText().issues.adoptAllShort}
      </button>
    </li>`;
  }

  #renderRows(issues: readonly EditorIssue[]): TemplateResult {
    const adoptable = issues.filter((issue) => issue.fix);
    const grouped = adoptable.length > 1;
    const single = grouped ? issues.filter((issue) => !issue.fix) : issues;
    const rows = [
      ...single
        .slice(0, grouped ? MAX_ROWS - 1 : MAX_ROWS)
        .map((issue) => this.#renderIssue(issue)),
      ...(grouped ? [this.#renderAdoptAll(adoptable.length)] : []),
    ];
    return html`<ul class="rows">
      ${rows}
    </ul>`;
  }

  protected override render(): TemplateResult {
    const issues = collectIssues(this.editor);
    const errors = issues.filter((issue) => issue.severity === 'error').length;
    const warnings = issues.length - errors;
    return html`
      <section class="card" aria-labelledby="issues-heading">
        <header class="head">
          <h2 id="issues-heading">${stepsText().issues.heading}</h2>
          <button
            class="counts"
            type="button"
            aria-label=${stepsText().issues.countsLabel(errors, warnings)}
            @click=${() => emit(this, 'issues')}
          >
            ${issues.length === 0 ? stepsText().issues.noneShort : `✕ ${errors} · ! ${warnings}`}
          </button>
        </header>
        ${issues.length > 0 ? this.#renderRows(issues) : nothing}
      </section>
    `;
  }
}
