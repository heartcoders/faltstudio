import { html, nothing, type TemplateResult } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import type { Step, StepIssue } from '@faltstudio/core';
import { BaseElement, boolProp, type Scene } from '@faltstudio/ui';
import type { Editor } from '../../state/editor.js';
import { movingPolygons, patternLines } from '../../state/pattern-view.js';
import { SheetController } from '../../state/sheet-controller.js';
import type { FoldDirection } from '../../state/step-editing.js';
import { StoreController } from '../../state/store-controller.js';
import { hitRadius, type CanvasPointer } from '../../tools/canvas-pointer.js';
import { hitCrease } from '../../tools/hit-test.js';
import { workspaceStyles } from '../../styles/workspace.js';
import { mobileStyles } from '../mobile/mobile.styles.js';
import { modeStepsStyles } from './mode-steps.styles.js';
import { kindHelpStyles, renderKindHelp } from '../kind-help.js';
import { common } from '../../i18n/common.js';
import { foldErrorText, stepsText } from '../../i18n/steps.js';

const STEP_KINDS = ['valley', 'mountain'] as const;

const pad = (value: number): string => String(value).padStart(2, '0');

const direction = (angle: number | undefined): FoldDirection =>
  (angle ?? 1) < 0 ? 'mountain' : 'valley';

/**
 * Modus 03 Schritte: Segmente in der 2D-Ansicht anklicken, rechts Seite und
 * Winkel einstellen, unten die Schrittfolge. 3D zeigt klein den Zielzustand.
 */
export class ModeSteps extends BaseElement {
  static override styles = [
    BaseElement.styles,
    workspaceStyles,
    mobileStyles,
    modeStepsStyles,
    kindHelpStyles,
  ];

  @property({ attribute: false }) editor!: Editor;
  /** Mobil (M5): 2D oder 3D oben, Schritt-Werkzeuge im Sheet. */
  @boolProp() mobile = false;
  @state() private view: '2d' | '3d' = '2d';
  @query('fl-scene') private scene?: Scene | null;

  #observed = false;
  #dragFrom: number | undefined;

  override connectedCallback(): void {
    super.connectedCallback();
    if (this.#observed) return;
    this.#observed = true;
    new StoreController(this, this.editor.document, this.editor.ui);
    new SheetController(this, {
      scene: () => this.scene,
      pattern: () => this.editor.pattern,
      state: () => this.editor.steps.preview,
    });
  }

  #onPointer(pointer: CanvasPointer): void {
    if (pointer.phase !== 'down') return;
    const hit = hitCrease(this.editor.pattern, pointer.point, hitRadius(pointer));
    if (hit) this.editor.steps.toggleCrease(hit);
  }

  #stepIssue(index: number): StepIssue | undefined {
    return this.editor.steps.issues.find((issue) => issue.stepIndex === index);
  }

  #renderSuggestion(): TemplateResult | typeof nothing {
    const steps = this.editor.steps;
    if (steps.suggestions.length === 0) return nothing;
    return html`
      <div class="overlay bottom-left suggestion">
        <p>${stepsText().steps.sameLine} <b>${steps.suggestions.join(', ')}</b></p>
        <fl-button size="small" variant="primary" @click=${() => steps.acceptSuggestions()}
          >${stepsText().steps.takeAlong}</fl-button
        >
      </div>
    `;
  }

  #renderStage(): TemplateResult {
    const steps = this.editor.steps;
    const fold = steps.fold;
    return html`
      <div class="stage">
        ${this.#renderStepHead()}
        <fl-crease-canvas
          interactive
          label=${stepsText().steps.canvasClick}
          .sheet=${this.editor.document.get().sheet}
          .lines=${patternLines(this.editor.pattern)}
          .selected=${fold?.creaseIds ?? []}
          .suggested=${steps.suggestions}
          .labelled=${[...(fold?.creaseIds ?? []), ...steps.suggestions]}
          .faces=${movingPolygons(this.editor.pattern, fold, steps.before)}
          @canvaspointer=${(event: CustomEvent<CanvasPointer>) => this.#onPointer(event.detail)}
        ></fl-crease-canvas>
        ${this.#renderSuggestion()}
      </div>
      <div class="preview">
        <fl-scene></fl-scene>
        ${this.#renderPlayback()}
      </div>
    `;
  }

  /** Umriss-Ziffer des aktuellen Schritts mit Titel, oben links auf dem Tisch (Desktop). */
  #renderStepHead(): TemplateResult {
    const steps = this.editor.steps;
    const step = steps.step;
    return html`
      <p class="step-head">
        <span class="step-index" aria-hidden="true">${step ? pad(steps.index + 1) : '00'}</span>
        <span class="step-head-text">
          <span class="caption"
            >${stepsText().steps.counter(pad(steps.index + 1), pad(steps.steps.length))}</span
          >
          <span class="step-head-title">${step?.title || stepsText().steps.noStepsYet}</span>
        </span>
      </p>
    `;
  }

  /** Schritt als Mini-Blatt in der Leiste: gewaehlt hebt es sich mit Lichtkante (Desktop). */
  #renderSheetCard(step: Step, index: number): TemplateResult {
    const steps = this.editor.steps;
    const fold = step.folds[0];
    const isSelected = index === steps.index;
    const hasIssue = this.#stepIssue(index) !== undefined;
    return html`
      <li
        draggable="true"
        @dragstart=${() => (this.#dragFrom = index)}
        @dragover=${(event: DragEvent) => event.preventDefault()}
        @drop=${() => this.#drop(index)}
      >
        <button
          class=${isSelected ? 'mini-sheet selected' : 'mini-sheet'}
          type="button"
          aria-pressed=${isSelected ? 'true' : 'false'}
          aria-label=${stepsText().steps.stepLabel(pad(index + 1), step.title, hasIssue)}
          title=${step.title}
          @click=${() => steps.select(index)}
        >
          <fl-crease-canvas
            mini
            hide-flat
            label=${stepsText().steps.diagram(pad(index + 1))}
            .sheet=${this.editor.document.get().sheet}
            .lines=${patternLines(this.editor.pattern)}
            .highlighted=${fold?.creaseIds ?? []}
            .faces=${movingPolygons(this.editor.pattern, fold, steps.timeline.boundaries[index])}
          ></fl-crease-canvas>
          <span class="mini-number" aria-hidden="true">${pad(index + 1)}</span>
          ${hasIssue ? html`<span class="mini-error" aria-hidden="true">✕</span>` : nothing}
        </button>
      </li>
    `;
  }

  /** Abspielen und Scrubben der Schritt-Vorschau, unten in der 3D-Ecke. */
  #renderPlayback(): TemplateResult | typeof nothing {
    const steps = this.editor.steps;
    if (!steps.fold) return nothing;
    const progress = Math.round(this.editor.ui.get().stepProgress * 100);
    return html`
      <div class="playback">
        <fl-button
          square
          size="small"
          accessibility-label=${stepsText().steps.play}
          @click=${() => steps.playPreview()}
          >▶</fl-button
        >
        <fl-slider
          label=${stepsText().steps.progress}
          unit="%"
          .value=${progress}
          @input=${(event: CustomEvent<number>) => steps.setPreviewProgress(event.detail / 100)}
        ></fl-slider>
      </div>
    `;
  }

  #renderFoldPicker(): TemplateResult | typeof nothing {
    const steps = this.editor.steps;
    const folds = steps.step?.folds ?? [];
    if (folds.length < 2 && steps.foldIndex < folds.length) return nothing;
    const count = Math.max(folds.length, steps.foldIndex + 1);
    return html`
      <fl-segmented
        label=${stepsText().steps.fold}
        fill
        .value=${String(steps.foldIndex)}
        @change=${(event: CustomEvent<string>) => steps.selectFold(Number(event.detail))}
      >
        ${Array.from({ length: count }, (_, index) => html`<fl-segment value=${String(index)}>${index + 1}</fl-segment>`)}
      </fl-segmented>
      ${
        folds.length > 1
          ? html`<fl-checkbox
              ?checked=${steps.step?.sequential === true}
              @change=${(event: CustomEvent<boolean>) => steps.setSequential(event.detail)}
              >${stepsText().steps.sequential}</fl-checkbox
            >`
          : nothing
      }
    `;
  }

  #renderSegments(): TemplateResult {
    const steps = this.editor.steps;
    const ids = steps.fold?.creaseIds ?? [];
    return html`
      <section>
        <h2>${stepsText().steps.foldLine}</h2>
        ${this.#renderFoldPicker()}
        ${
          ids.length === 0
            ? html`<p class="hint">${stepsText().steps.clickLine}</p>`
            : html`<ul class="chips">
                ${ids.map((id) => html`<li><fl-button size="small" accessibility-label=${stepsText().steps.removeId(id)} @click=${() => steps.toggleCrease(id)}>${id} ×</fl-button></li>`)}
              </ul>`
        }
        <div class="row">
          <fl-button
            size="small"
            variant="tertiary"
            ?disabled=${!steps.fold}
            @click=${() => steps.addFold()}
            >${stepsText().steps.addFold}</fl-button
          >
          ${steps.fold ? html`<fl-button size="small" variant="tertiary" @click=${() => steps.removeCurrentFold()}>${stepsText().steps.remove}</fl-button>` : nothing}
        </div>
      </section>
    `;
  }

  #renderSide(): TemplateResult | typeof nothing {
    const steps = this.editor.steps;
    if (steps.sides.length < 2) return nothing;
    return html`
      <section>
        <h2>${stepsText().steps.movingSide}</h2>
        <fl-segmented
          label=${stepsText().steps.movingSide}
          fill
          .value=${String(steps.movingSide)}
          @change=${(event: CustomEvent<string>) => steps.chooseSide(Number(event.detail))}
        >
          ${steps.sides.map((_, index) => html`<fl-segment value=${String(index)}>${String.fromCharCode(65 + index)}</fl-segment>`)}
        </fl-segmented>
      </section>
    `;
  }

  #renderAngle(): TemplateResult | typeof nothing {
    const steps = this.editor.steps;
    const fold = steps.fold;
    if (!fold) return nothing;
    const angle = this.editor.ui.get().angleDraft ?? Math.abs(fold.angle);
    return html`
      <section>
        <h2>${stepsText().steps.angle(angle.toFixed(0))}</h2>
        <fl-dial
          .value=${angle}
          @input=${(event: CustomEvent<number>) => steps.dragAngle(event.detail)}
          @change=${(event: CustomEvent<number>) => steps.setAngle(event.detail)}
        ></fl-dial>
        <div class="row">
          <fl-segmented
            label=${stepsText().steps.foldKind}
            fill
            .value=${direction(fold.angle)}
            @change=${(event: CustomEvent<FoldDirection>) => steps.setDirection(event.detail)}
          >
            <fl-segment value="valley">${common().kinds.valley}</fl-segment>
            <fl-segment value="mountain">${common().kinds.mountain}</fl-segment>
          </fl-segmented>
          <fl-button size="small" @click=${() => steps.setAngle(90)}>90°</fl-button>
          <fl-button size="small" @click=${() => steps.setAngle(180)}>180°</fl-button>
        </div>
        ${renderKindHelp(STEP_KINDS)}
      </section>
    `;
  }

  #renderEditor(): TemplateResult {
    const steps = this.editor.steps;
    const step = steps.step;
    if (!step) {
      return html`<aside class="context">
        <p class="hint">${stepsText().steps.noStepsYet}</p>
        <fl-button variant="primary" @click=${() => steps.add()}
          >${stepsText().steps.firstStep}</fl-button
        >
      </aside>`;
    }
    const issue = this.#stepIssue(steps.index);
    return html`
      <aside class="context" aria-label=${common().step(pad(steps.index + 1))}>
        <section>
          <div class="title-row">
            <h2>${stepsText().steps.counter(pad(steps.index + 1), pad(steps.steps.length))}</h2>
            <fl-button
              size="small"
              variant="tertiary"
              tone="critical"
              @click=${() => steps.remove()}
              >${stepsText().steps.delete}</fl-button
            >
          </div>
          <fl-text-field
            label=${stepsText().steps.titleLabel}
            .value=${step.title}
            @change=${(event: CustomEvent<string>) => steps.rename(event.detail)}
          ></fl-text-field>
          <fl-text-field
            label=${stepsText().steps.hint}
            multiline
            .value=${step.text}
            @change=${(event: CustomEvent<string>) => steps.describe(event.detail)}
          ></fl-text-field>
        </section>
        ${this.#renderSegments()} ${this.#renderSide()} ${this.#renderAngle()}
        ${issue ? html`<fl-issue severity="error" code="E1" heading=${stepsText().steps.notFoldable}>${foldErrorText(issue.error)}</fl-issue>` : nothing}
      </aside>
    `;
  }

  #drop(to: number): void {
    const from = this.#dragFrom;
    this.#dragFrom = undefined;
    if (from !== undefined && from !== to) this.editor.steps.move(from, to);
  }

  #renderMobileStage(): TemplateResult {
    const steps = this.editor.steps;
    const fold = steps.fold;
    const show3d = this.view === '3d';
    return html`
      <div class="table-surface stage">
        <div class="stage-bar">
          <span class="caption"
            >${steps.steps.length > 0 ? stepsText().steps.counter(pad(steps.index + 1), pad(steps.steps.length)) : stepsText().steps.noSteps}</span
          >
          <div class="view-switch" role="group" aria-label=${stepsText().steps.view}>
            <button
              class="text-action${show3d ? '' : ' strong'}"
              type="button"
              aria-pressed=${show3d ? 'false' : 'true'}
              @click=${() => (this.view = '2d')}
            >
              2D
            </button>
            <button
              class="text-action${show3d ? ' strong' : ''}"
              type="button"
              aria-pressed=${show3d ? 'true' : 'false'}
              @click=${() => (this.view = '3d')}
            >
              3D
            </button>
          </div>
        </div>
        <div class="view" ?hidden=${show3d}>
          <fl-crease-canvas
            interactive
            zoomable
            label=${stepsText().steps.canvasTap}
            .sheet=${this.editor.document.get().sheet}
            .lines=${patternLines(this.editor.pattern)}
            .selected=${fold?.creaseIds ?? []}
            .suggested=${steps.suggestions}
            .labelled=${[...(fold?.creaseIds ?? []), ...steps.suggestions]}
            .faces=${movingPolygons(this.editor.pattern, fold, steps.before)}
            @canvaspointer=${(event: CustomEvent<CanvasPointer>) => this.#onPointer(event.detail)}
          ></fl-crease-canvas>
        </div>
        <div class="view" ?hidden=${!show3d}><fl-scene></fl-scene></div>
      </div>
    `;
  }

  /**
   * Ein Mini-Blatt im Faecher (R6): das gewaehlte hebt sich mit Lichtkante,
   * die anderen liegen leicht verdreht daneben.
   */
  #renderFanSheet(step: Step, index: number): TemplateResult {
    const steps = this.editor.steps;
    const fold = step.folds[0];
    const selected = index === steps.index;
    const failing = this.#stepIssue(index) !== undefined;
    return html`
      <li style="--offset: ${index - steps.index}">
        <button
          class=${selected ? 'fan-sheet selected' : 'fan-sheet'}
          type="button"
          aria-current=${selected ? 'step' : 'false'}
          aria-label=${stepsText().steps.stepLabel(pad(index + 1), step.title, failing)}
          @click=${() => steps.select(index)}
        >
          <fl-crease-canvas
            mini
            hide-flat
            label=${stepsText().steps.diagram(pad(index + 1))}
            .sheet=${this.editor.document.get().sheet}
            .lines=${patternLines(this.editor.pattern)}
            .highlighted=${fold?.creaseIds ?? []}
          ></fl-crease-canvas>
          <span class="fan-number" aria-hidden="true">${pad(index + 1)}</span>
          ${failing ? html`<span class="fan-error" aria-hidden="true">✕</span>` : nothing}
        </button>
      </li>
    `;
  }

  #renderFan(): TemplateResult {
    const steps = this.editor.steps;
    return html`
      <div slot="head" class="fan-row">
        <ol class="fan" aria-label=${stepsText().steps.sequence}>
          ${steps.steps.map((item, index) => this.#renderFanSheet(item, index))}
        </ol>
        <button
          class="tap dashed add-sheet"
          type="button"
          aria-label=${stepsText().steps.addStep}
          @click=${() => steps.add()}
        >
          +
        </button>
      </div>
    `;
  }

  /** Linie (C14): gewaehlt = invertiert mit ×, kollinearer Vorschlag = gestrichelt. */
  #renderMobileChips(): TemplateResult {
    const steps = this.editor.steps;
    const ids = steps.fold?.creaseIds ?? [];
    return html`
      <div class="sheet-line chip-row">
        ${ids.length === 0 ? html`<span class="hint">${stepsText().steps.tapLine}</span>` : nothing}
        ${ids.map((id) => html`<button class="tap chip" type="button" aria-label=${stepsText().steps.removeId(id)} @click=${() => steps.toggleCrease(id)}>${id} ×</button>`)}
        ${
          steps.suggestions.length > 0
            ? html`<button
                class="tap dashed chip"
                type="button"
                @click=${() => steps.acceptSuggestions()}
              >
                ${stepsText().steps.takeAlongIds(steps.suggestions.join(', '))}
              </button>`
            : nothing
        }
      </div>
      ${
        (steps.step?.folds.length ?? 0) > 1 || steps.foldIndex >= (steps.step?.folds.length ?? 0)
          ? html`<div class="sheet-line">${this.#renderFoldPicker()}</div>`
          : nothing
      }
    `;
  }

  #renderMobileSide(): TemplateResult | typeof nothing {
    const steps = this.editor.steps;
    if (steps.sides.length < 2) return nothing;
    return html`<div class="sheet-line">
      <fl-segmented
        label=${stepsText().steps.movingSide}
        fill
        .value=${String(steps.movingSide)}
        @change=${(event: CustomEvent<string>) => steps.chooseSide(Number(event.detail))}
      >
        ${steps.sides.map((_, index) => html`<fl-segment value=${String(index)}>${stepsText().steps.side(String.fromCharCode(65 + index))}</fl-segment>`)}
      </fl-segmented>
    </div>`;
  }

  /** Drehregler links, grosse Gradzahl und Tal/Berg rechts (R6). */
  #renderMobileFold(): TemplateResult | typeof nothing {
    const steps = this.editor.steps;
    const fold = steps.fold;
    if (!fold) return nothing;
    const angle = this.editor.ui.get().angleDraft ?? Math.abs(fold.angle);
    return html`
      ${this.#renderMobileSide()}
      <div class="sheet-line dial-row">
        <fl-dial
          .value=${angle}
          @input=${(event: CustomEvent<number>) => steps.dragAngle(event.detail)}
          @change=${(event: CustomEvent<number>) => steps.setAngle(event.detail)}
        ></fl-dial>
        <div class="angle">
          <span class="angle-value" aria-live="polite">${angle.toFixed(0)}°</span>
          <fl-segmented
            label=${stepsText().steps.foldKind}
            fill
            .value=${direction(fold.angle)}
            @change=${(event: CustomEvent<FoldDirection>) => steps.setDirection(event.detail)}
          >
            <fl-segment value="valley">${common().kinds.valley}</fl-segment>
            <fl-segment value="mountain">${common().kinds.mountain}</fl-segment>
          </fl-segmented>
        </div>
      </div>
      ${renderKindHelp(STEP_KINDS)} ${this.#renderMobilePlayback()}
    `;
  }

  #renderMobilePlayback(): TemplateResult {
    const steps = this.editor.steps;
    const progress = Math.round(this.editor.ui.get().stepProgress * 100);
    return html`
      <div class="sheet-line playback-row">
        <button
          class="tap play"
          type="button"
          aria-label=${stepsText().steps.play}
          @click=${() => steps.playPreview()}
        >
          ▶
        </button>
        <fl-slider
          label=${stepsText().steps.progress}
          unit="%"
          .value=${progress}
          @input=${(event: CustomEvent<number>) => steps.setPreviewProgress(event.detail / 100)}
        ></fl-slider>
        <span class="progress">${progress} %</span>
      </div>
    `;
  }

  #renderMobileStep(step: Step): TemplateResult {
    const steps = this.editor.steps;
    const issue = this.#stepIssue(steps.index);
    return html`
      <div class="sheet-line title-line">
        <input
          class="title-input"
          type="text"
          aria-label=${stepsText().steps.titleOfStep(pad(steps.index + 1))}
          .value=${step.title}
          @change=${(event: Event) => steps.rename((event.target as HTMLInputElement).value)}
        />
        <button
          class="tap square"
          type="button"
          aria-label=${stepsText().steps.deleteStep(pad(steps.index + 1))}
          @click=${() => steps.remove()}
        >
          ✕
        </button>
      </div>
      ${
        issue
          ? html`<fl-issue severity="error" code="E1" heading=${stepsText().steps.notFoldable}
              >${foldErrorText(issue.error)}</fl-issue
            >`
          : nothing
      }
      ${this.#renderMobileChips()} ${this.#renderMobileFold()}
    `;
  }

  #renderMobileSheet(): TemplateResult {
    const step = this.editor.steps.step;
    return html`
      <fl-sheet level="half" label=${stepsText().steps.editStep}>
        ${this.#renderFan()}
        ${
          step
            ? this.#renderMobileStep(step)
            : html`<p class="hint sheet-line">${stepsText().steps.mobileEmpty}</p>`
        }
      </fl-sheet>
    `;
  }

  protected override render(): TemplateResult {
    const steps = this.editor.steps;
    if (this.mobile)
      return html`<div class="mobile">
        ${this.#renderMobileStage()} ${this.#renderMobileSheet()}
      </div>`;
    return html`
      <div class="layout table-surface">
        ${this.#renderStage()} ${this.#renderEditor()}
        <ol class="cards" aria-label=${stepsText().steps.sequence}>
          ${steps.steps.map((step, index) => this.#renderSheetCard(step, index))}
          <li>
            <button
              class="add-sheet"
              type="button"
              aria-label=${stepsText().steps.addStep}
              @click=${() => steps.add()}
            >
              +
            </button>
          </li>
        </ol>
      </div>
    `;
  }
}
