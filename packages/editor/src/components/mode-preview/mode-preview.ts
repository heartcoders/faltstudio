import { html, type PropertyValues, type TemplateResult } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { restPose, stateAt, type FoldState, type RestPose, type Step } from '@faltstudio/core';
import { BaseElement, boolProp, type CameraView, type Scene } from '@faltstudio/ui';
import type { Editor } from '../../state/editor.js';
import { StoreController } from '../../state/store-controller.js';
import { SheetController } from '../../state/sheet-controller.js';
import { workspaceStyles } from '../../styles/workspace.js';
import { mobileStyles } from '../mobile/mobile.styles.js';
import { modePreviewStyles } from './mode-preview.styles.js';
import { stepsText } from '../../i18n/steps.js';

type Tempo = '0.5' | '1' | '2';

const STEP_DURATION_MS = 1500;
const POSE_DURATION_MS = 900;
const pad = (value: number): string => String(value).padStart(2, '0');

/**
 * Modus 04 Vorschau (S4): grosse 3D-Ansicht, Zeitleiste ueber alle Schritte,
 * Pruefung und Weitergabe. `position` 2.55 = Schritt 3 zu 55 % gefaltet.
 */
export class ModePreview extends BaseElement {
  static override styles = [BaseElement.styles, workspaceStyles, mobileStyles, modePreviewStyles];

  @property({ attribute: false }) editor!: Editor;
  /** Mobil (M6): 3D vollflaechig, Zeitleiste und Transport unten. */
  @boolProp() mobile = false;
  @state() private position = 0;
  @state() private camera: CameraView = 'iso';
  @state() private tempo: Tempo = '1';
  @state() private playing = false;
  @query('fl-scene') private scene?: Scene | null;

  #observed = false;
  #frame = 0;
  #pose: RestPose | undefined;
  #poseAmount = 0;
  #poseFrame = 0;

  override connectedCallback(): void {
    super.connectedCallback();
    if (this.#observed) return;
    this.#observed = true;
    new StoreController(this, this.editor.document);
    new SheetController(this, {
      scene: () => this.scene,
      pattern: () => this.editor.pattern,
      state: () => this.#state(),
      pose: () => ({ pose: this.#pose, amount: this.#poseAmount }),
    });
    this.position = this.editor.steps.index;
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    cancelAnimationFrame(this.#frame);
    cancelAnimationFrame(this.#poseFrame);
  }

  #state(): FoldState {
    const whole = Math.floor(this.position);
    return stateAt(this.editor.steps.timeline, whole, this.position - whole);
  }

  get #steps(): readonly Step[] {
    return this.editor.steps.steps;
  }

  get #stepIndex(): number {
    return Math.min(Math.max(0, this.#steps.length - 1), Math.floor(this.position));
  }

  protected override updated(changed: PropertyValues): void {
    if (changed.has('camera')) this.scene?.setView?.(this.camera);
    if (changed.has('position')) this.#followPose();
  }

  /**
   * Am Ende der Zeitleiste dreht sich das fertige Modell in die Ruhelage (wie im
   * Viewer); sobald man zurueckspult, zeigt die Vorschau wieder die echte Geometrie.
   */
  #followPose(): void {
    const finished = this.#steps.length > 0 && this.position >= this.#steps.length;
    if (finished === (this.#pose !== undefined)) return;
    cancelAnimationFrame(this.#poseFrame);
    if (!finished) {
      this.#pose = undefined;
      this.#poseAmount = 0;
      return;
    }
    const last = this.editor.steps.timeline.boundaries.at(-1);
    if (!last) return;
    this.#pose = restPose(this.editor.pattern, last);
    this.#animatePose(performance.now());
  }

  #animatePose(start: number): void {
    const tick = (now: number): void => {
      const ratio = Math.min(1, (now - start) / POSE_DURATION_MS);
      this.#poseAmount = 1 - (1 - ratio) ** 3;
      this.requestUpdate();
      if (ratio < 1) this.#poseFrame = requestAnimationFrame(tick);
      else this.scene?.recenter?.();
    };
    this.#poseFrame = requestAnimationFrame(tick);
  }

  #play(): void {
    if (this.playing) return this.#stop();
    if (this.position >= this.#steps.length) this.position = 0;
    this.#runTo(this.#steps.length);
  }

  /** Spielt vorwaerts bis `target` (Schrittgrenze oder Ende) im gewaehlten Tempo. */
  #runTo(target: number): void {
    cancelAnimationFrame(this.#frame);
    this.playing = true;
    let last = performance.now();
    const tick = (now: number): void => {
      this.position = Math.min(
        target,
        this.position + ((now - last) / STEP_DURATION_MS) * Number(this.tempo),
      );
      last = now;
      if (this.position >= target) return this.#stop();
      this.#frame = requestAnimationFrame(tick);
    };
    this.#frame = requestAnimationFrame(tick);
  }

  #stop(): void {
    cancelAnimationFrame(this.#frame);
    this.playing = false;
  }

  /**
   * Vor faltet den laufenden Schritt sichtbar zu Ende (wie „Weiter“ im Viewer),
   * zurueck springt an den Anfang des vorigen Schritts.
   */
  #jump(delta: number): void {
    this.#stop();
    if (delta > 0) {
      const target = Math.min(this.#steps.length, Math.floor(this.position) + 1);
      if (target > this.position) this.#runTo(target);
      return;
    }
    this.position = Math.max(0, Math.ceil(this.position) - 1);
  }

  #renderStage(): TemplateResult {
    const step = this.#steps[this.#stepIndex];
    const finished = this.#steps.length > 0 && this.position >= this.#steps.length;
    return html`
      <div class="table-surface stage">
        <fl-scene class="fill-scene"></fl-scene>
        <p class="overlay top-left step-caption">
          <span class="step-index" aria-hidden="true"
            >${finished ? '✓' : pad(this.#steps.length > 0 ? this.#stepIndex + 1 : 0)}</span
          >
          <span class="step-text">
            <span class="caption"
              >${finished ? stepsText().preview.finished : stepsText().steps.counter(pad(this.#stepIndex + 1), pad(this.#steps.length))}</span
            >
            <span class="step-title"
              >${finished ? this.editor.document.get().meta.title : (step?.title ?? stepsText().steps.noSteps)}</span
            >
          </span>
        </p>
        <div class="overlay top-right">
          <fl-segmented
            label=${stepsText().preview.camera}
            orientation="vertical"
            .value=${this.camera}
            @change=${(event: CustomEvent<CameraView>) => (this.camera = event.detail)}
          >
            <fl-segment value="iso">${stepsText().preview.cameraIso}</fl-segment>
            <fl-segment value="top">${stepsText().preview.cameraTop}</fl-segment>
            <fl-segment value="side">${stepsText().preview.cameraSide}</fl-segment>
            <fl-segment value="front">${stepsText().preview.cameraFront}</fl-segment>
          </fl-segmented>
        </div>
      </div>
    `;
  }

  #renderTimeline(): TemplateResult {
    const count = Math.max(1, this.#steps.length);
    return html`
      <section class="timeline" aria-label=${stepsText().preview.timeline}>
        <div class="transport">
          <fl-button
            square
            accessibility-label=${stepsText().preview.stepBack}
            @click=${() => this.#jump(-1)}
            >◀◀</fl-button
          >
          <fl-button variant="primary" @click=${() => this.#play()}
            >${this.playing ? stepsText().preview.pause : stepsText().preview.play}</fl-button
          >
          <fl-button
            square
            accessibility-label=${stepsText().preview.stepForward}
            @click=${() => this.#jump(1)}
            >▶▶</fl-button
          >
        </div>
        <div class="track">
          <ol class="titles" aria-hidden="true" style=${styleMap({ '--steps': String(count) })}>
            ${this.#steps.map((step, index) => html`<li class=${index <= this.#stepIndex ? 'reached' : ''}><b>${pad(index + 1)}</b> ${step.title}</li>`)}
          </ol>
          <fl-step-track
            scrub
            unlabeled
            label=${stepsText().preview.timeline}
            steps=${count}
            .position=${this.position}
            @input=${(event: CustomEvent<number>) => {
              this.#stop();
              this.position = event.detail;
            }}
          ></fl-step-track>
        </div>
        <div class="tempo">
          <p class="caption">${stepsText().preview.tempo}</p>
          <fl-segmented
            label=${stepsText().preview.tempo}
            .value=${this.tempo}
            @change=${(event: CustomEvent<Tempo>) => (this.tempo = event.detail)}
          >
            <fl-segment value="0.5">0.5×</fl-segment>
            <fl-segment value="1">1×</fl-segment>
            <fl-segment value="2">2×</fl-segment>
          </fl-segmented>
        </div>
      </section>
    `;
  }

  #renderMobile(): TemplateResult {
    const steps = this.#steps;
    const step = steps[this.#stepIndex];
    const finished = steps.length > 0 && this.position >= steps.length;
    const angle = Math.abs(step?.folds[0]?.angle ?? 0);
    const percent = Math.round((this.position - Math.floor(this.position)) * 100);
    const tempos: readonly Tempo[] = ['0.5', '1', '2'];
    const nextTempo = tempos[(tempos.indexOf(this.tempo) + 1) % tempos.length] ?? '1';
    return html`
      <div class="mobile">
        <div class="table-surface stage">
          <p class="index preview-index" aria-hidden="true">
            ${pad(Math.min(this.#stepIndex + 1, Math.max(1, steps.length)))}
          </p>
          <fl-scene class="fill-scene"></fl-scene>
          <p class="preview-caption">
            <span class="caption"
              >${
                finished
                  ? stepsText().preview.finished
                  : `${stepsText().steps.counter(pad(this.#stepIndex + 1), pad(steps.length))} · ∠ ${angle.toFixed(0)}°`
              }</span
            >
            <b class="step-title"
              >${finished ? this.editor.document.get().meta.title : (step?.title ?? stepsText().steps.noSteps)}</b
            >
          </p>
        </div>
        <section class="mobile-timeline" aria-label=${stepsText().preview.timeline}>
          <fl-step-track
            scrub
            label=${stepsText().preview.timeline}
            steps=${Math.max(1, steps.length)}
            .position=${this.position}
            @input=${(event: CustomEvent<number>) => {
              this.#stop();
              this.position = event.detail;
            }}
          ></fl-step-track>
          <span class="position"
            >${finished ? stepsText().preview.finished : `${pad(this.#stepIndex + 1)} · ${percent} %`}</span
          >
          <div class="mobile-transport">
            <button
              class="tap"
              type="button"
              aria-label=${stepsText().preview.stepBack}
              @click=${() => this.#jump(-1)}
            >
              ◀◀
            </button>
            <button class="tap primary" type="button" @click=${() => this.#play()}>
              <span>${this.playing ? 'Pause' : stepsText().preview.playMobile}</span
              ><span aria-hidden="true">${this.playing ? '❚❚' : '▶'}</span>
            </button>
            <button
              class="tap"
              type="button"
              aria-label=${stepsText().preview.stepForward}
              @click=${() => this.#jump(1)}
            >
              ▶▶
            </button>
            <button
              class="tap tempo-tap"
              type="button"
              aria-label=${stepsText().preview.tempoCycle(this.tempo)}
              @click=${() => (this.tempo = nextTempo)}
            >
              ${this.tempo}×
            </button>
          </div>
        </section>
      </div>
    `;
  }

  protected override render(): TemplateResult {
    if (this.mobile) return this.#renderMobile();
    return html`<div class="layout">${this.#renderStage()} ${this.#renderTimeline()}</div>`;
  }
}
