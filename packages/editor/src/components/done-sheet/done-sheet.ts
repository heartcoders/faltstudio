import { html, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { BaseElement, boolProp, emit } from '@faltstudio/ui';
import type { Editor } from '../../state/editor.js';
import { HOME_HREF, viewHref } from '../../state/route.js';
import { StoreController } from '../../state/store-controller.js';
import { ViewportController } from '../../state/viewport.js';
import { collectIssues } from '../../state/issues.js';
import { doneSheetStyles } from './done-sheet.styles.js';
import { common } from '../../i18n/common.js';
import { stepsText } from '../../i18n/steps.js';

/**
 * Abschluss eines Modells: speichert sofort, dann Namen vergeben, dann Anleitung ansehen, teilen oder
 * zur Uebersicht. Mobil als Sheet, auf dem Desktop mittig.
 *
 * @fires close - Sheet schliessen, weiter im Editor.
 */
export class DoneSheet extends BaseElement {
  static override styles = [BaseElement.styles, doneSheetStyles];

  @property({ attribute: false }) editor!: Editor;
  /** Direkt mit dem QR-Code starten (Datei · Teilen). */
  @boolProp() sharing = false;

  #observed = false;
  readonly #viewport = new ViewportController(this);

  override connectedCallback(): void {
    super.connectedCallback();
    if (this.#observed) return;
    this.#observed = true;
    new StoreController(this, this.editor.document);
    void this.editor.flush();
  }

  async #handleNavigate(href: string): Promise<void> {
    await this.editor.flush();
    location.href = href;
  }

  readonly #handleBackdrop = (event: Event): void => {
    if (event.target === event.currentTarget) emit(this, 'close');
  };

  #renderSummary(): TemplateResult {
    const document = this.editor.document.get();
    const errors = collectIssues(this.editor).filter((issue) => issue.severity === 'error').length;
    const text = stepsText().done;
    const state = errors > 0 ? text.errors(errors) : text.foldable;
    return html`<p class="summary">${common().steps(document.steps.length)} · ${state}</p>`;
  }

  #renderChoices(): TemplateResult {
    const view = viewHref({ kind: 'model', id: this.editor.modelId });
    return html`
      <div class="choices">
        <button
          class="button primary"
          type="button"
          @click=${() => void this.#handleNavigate(view)}
        >
          <span>${stepsText().done.viewGuide}</span><span aria-hidden="true">→</span>
        </button>
        <button class="button" type="button" @click=${() => (this.sharing = true)}>
          <span>${stepsText().done.shareQr}</span><span aria-hidden="true">⌗</span>
        </button>
        <button class="button" type="button" @click=${() => void this.#handleNavigate(HOME_HREF)}>
          <span>${stepsText().done.toOverview}</span><span aria-hidden="true">←</span>
        </button>
      </div>
    `;
  }

  protected override render(): TemplateResult {
    const document = this.editor.document.get();
    return html`
      <div class="layer" @click=${this.#handleBackdrop}>
        <fl-sheet
          level=${this.sharing ? 'full' : 'half'}
          ?floating=${!this.#viewport.mobile}
          label=${stepsText().done.title}
          @change=${(event: CustomEvent<string>) => event.detail === 'peek' && emit(this, 'close')}
        >
          <div slot="head" class="head">
            <p class="title">${this.sharing ? stepsText().done.share : stepsText().done.title}</p>
            <button
              class="close"
              type="button"
              aria-label=${common().close}
              @click=${() => emit(this, 'close')}
            >
              ×
            </button>
          </div>
          <div class="body">
            <fl-text-field
              label=${stepsText().done.name}
              .value=${document.meta.title}
              @change=${(event: CustomEvent<string>) => this.editor.rename(event.detail)}
            ></fl-text-field>
            ${this.#renderSummary()}
            ${this.sharing ? html`<fl-share-panel .tutorial=${document}></fl-share-panel>` : this.#renderChoices()}
          </div>
        </fl-sheet>
      </div>
    `;
  }
}
