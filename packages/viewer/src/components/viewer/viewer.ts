import { html, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { keyed } from 'lit/directives/keyed.js';
import { styleMap } from 'lit/directives/style-map.js';
import {
  foldHandle,
  restPose,
  stateAt,
  TutorialFormatError,
  type FoldHandle,
  type RestPose,
  type Step,
} from '@faltstudio/core';
import type { FoldGuides, FoldedSheet } from '@faltstudio/core/three';
import {
  BaseElement,
  boolProp,
  emit,
  readTokenColor,
  resolveLocale,
  type Locale,
  type Scene,
} from '@faltstudio/ui';
import { msg } from '../../i18n.js';
import { FoldDrag } from './fold-drag.js';
import type * as Viewer3d from './viewer-3d.js';
import type { Group } from 'three';
import { loadTutorial, TutorialLoadError, type LoadedTutorial } from './load-tutorial.js';
import { DEMO_DURATION_MS, chipLabel, type FoldMotion, type FoldState } from './viewer-state.js';
import { viewerStyles } from './viewer.styles.js';

const pad = (value: number): string => String(value).padStart(2, '0');

/** Dauer der Drehung in die Ruhelage, wenn der Flieger fertig ist. */
const POSE_DURATION_MS = 900;

/** Kurz eingerastet zeigen, bevor "Weiter" zum naechsten Schritt wechselt. */
const ADVANCE_PAUSE_MS = 180;

/**
 * Von Hand eingerastet: etwas laenger stehen lassen, damit man das Ergebnis
 * sieht, dann geht es von selbst zum naechsten Schritt.
 */
const DRAG_ADVANCE_PAUSE_MS = 700;

/** "Weiter" faltet in fester Zeit, sanft an- und auslaufend statt mit langem Nachlauf. */
const ADVANCE_FOLD_MS = 1100;

/** Hilfen des neuen Schritts blenden so lange ein. */
const GUIDE_FADE_MS = 320;

type Easing = (ratio: number) => number;

const easeOut: Easing = (ratio) => 1 - (1 - ratio) ** 3;
const easeInOut: Easing = (ratio) => (ratio < 0.5 ? 4 * ratio ** 3 : 1 - (-2 * ratio + 2) ** 3 / 2);

type LoadStatus =
  | { readonly kind: 'idle' | 'loading' }
  | { readonly kind: 'ready'; readonly data: LoadedTutorial }
  | { readonly kind: 'failed'; readonly error: unknown };

/**
 * Einbettbarer Viewer: `<fl-viewer src="flieger.json">`, als Seite oder Widget.
 *
 * @fires stepchange - detail: { index, count }, wenn ein Schritt beginnt.
 * @fires complete - detail: { count }, wenn der letzte Schritt eingerastet ist.
 * Redesign „Tisch & Papier“ (R4 Nachfalten): grosse Umriss-Ziffer des Schritts,
 * Status-Chip, Strichleiste, unten Zurueck / Weiter / Vorfuehren. Per Container
 * Query mobil wie R4, auf breiten Flaechen liegt die Bedienung als Karte auf dem
 * Tisch; mit `embedded` kompakt.
 */
export class Viewer extends BaseElement {
  static override styles = [BaseElement.styles, viewerStyles];

  @property({ reflect: true }) src?: string;

  /** Optional: Marke verlinkt zur Startseite (Studio). */
  @property({ attribute: 'home-href' }) homeHref?: string;

  /** Optional: Link "Bearbeiten" in der Kopfzeile (Studio). */
  @property({ attribute: 'edit-href' }) editHref?: string;

  /** Kompaktes Widget in fremden Seiten, ohne eigene Kopfzeile der App. */
  @boolProp() embedded = false;

  @state() private load: LoadStatus = { kind: 'idle' };
  @state() private stepIndex = 0;
  @state() private progress = 0;
  @state() private foldState: FoldState = 'ready';
  @state() private showAid = false;
  @state() private menuOpen = false;
  @state() private motion: FoldMotion = 'auto';

  @query('fl-scene') private scene?: Scene | null;

  #sheet: FoldedSheet | undefined;
  #guides: FoldGuides | undefined;
  #handle: FoldHandle | undefined;
  #handleKey = '';
  #frame = 0;
  #guideFrame = 0;
  #abort: AbortController | undefined;
  #detachDrag: (() => void) | undefined;
  #three: typeof Viewer3d | undefined;
  #content: Group | undefined;
  #pose: RestPose | undefined;
  #poseAmount = 0;
  #poseFrame = 0;
  #advanceTimer: ReturnType<typeof setTimeout> | undefined;

  readonly #drag = new FoldDrag({
    scene: () => this.#readyScene,
    sheet: () => this.#sheet,
    handle: () => this.#currentHandle(),
    canGrab: () => this.foldState === 'ready' && this.load.kind === 'ready',
    onDragStart: () => {
      cancelAnimationFrame(this.#frame);
      this.motion = 'drag';
      this.foldState = 'dragging';
    },
    onDrag: (progress) => {
      this.progress = this.#stepProgress(progress);
    },
    onRelease: (snap) => {
      this.motion = 'release';
      this.#animateTo(
        snap ? 1 : 0,
        snap ? () => this.#scheduleAdvance(DRAG_ADVANCE_PAUSE_MS) : undefined,
      );
    },
  });

  get #data(): LoadedTutorial | undefined {
    return this.load.kind === 'ready' ? this.load.data : undefined;
  }

  get #steps(): readonly Step[] {
    return this.#data?.tutorial.steps ?? [];
  }

  get #step(): Step | undefined {
    return this.#steps[this.stepIndex];
  }

  get #angle(): number {
    const step = this.#step;
    const target = Math.abs(step?.folds[0]?.angle ?? 0);
    const folds = Math.max(1, step?.folds.length ?? 1);
    const progress = step?.sequential ? Math.min(1, this.progress * folds) : this.progress;
    return target * progress;
  }

  get #position(): number {
    return this.foldState === 'done' ? this.#steps.length : this.stepIndex + this.progress;
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    cancelAnimationFrame(this.#frame);
    cancelAnimationFrame(this.#poseFrame);
    cancelAnimationFrame(this.#guideFrame);
    clearTimeout(this.#advanceTimer);
    this.#abort?.abort();
    this.#detachDrag?.();
    this.#detachDrag = undefined;
    this.#sheet?.dispose();
    this.#guides?.dispose();
    this.#sheet = undefined;
    this.#guides = undefined;
  }

  /** Die Szene erst, wenn ihr Modul nachgeladen und das Element aufgewertet ist. */
  get #readyScene(): Scene | undefined {
    return customElements.get('fl-scene') && this.scene ? this.scene : undefined;
  }

  protected override firstUpdated(): void {
    if (this.scene) this.#detachDrag = this.#drag.attach(this.scene);
  }

  /** Griff fuer die erste Faltung des aktuellen Schritts, je Schritt einmal berechnet. */
  #currentHandle(): FoldHandle | undefined {
    const data = this.#data;
    const fold = this.#step?.folds[0];
    const before = data?.timeline.boundaries[this.stepIndex];
    const key = `${this.stepIndex}`;
    if (key === this.#handleKey) return this.#handle;
    this.#handleKey = key;
    const result =
      data && fold && before ? foldHandle(data.timeline.pattern, before, fold) : undefined;
    this.#handle = result?.ok ? result.value : undefined;
    return this.#handle;
  }

  /** Bei Schritten mit Faltungen nacheinander zieht man nur die erste. */
  #stepProgress(foldProgress: number): number {
    const step = this.#step;
    return step?.sequential ? foldProgress / Math.max(1, step.folds.length) : foldProgress;
  }

  protected override willUpdate(changed: PropertyValues): void {
    if (changed.has('src')) void this.#loadSource();
  }

  protected override updated(changed: PropertyValues): void {
    if (changed.has('load')) void this.#mountSheet();
    this.#showState();
  }

  async #loadSource(): Promise<void> {
    this.#abort?.abort();
    if (!this.src) return;
    const abort = new AbortController();
    this.#abort = abort;
    this.load = { kind: 'loading' };
    try {
      const data = await loadTutorial(this.src, abort.signal);
      this.load = { kind: 'ready', data };
      this.#goTo(0);
    } catch (error) {
      if (abort.signal.aborted) return;
      console.error('Tutorial nicht ladbar', this.src, error);
      this.load = { kind: 'failed', error };
    }
  }

  async #mountSheet(): Promise<void> {
    const data = this.#data;
    if (!data || !this.scene) return;
    const [three] = await Promise.all([
      import('./viewer-3d.js'),
      customElements.whenDefined('fl-scene'),
    ]);
    if (this.#data !== data || !this.scene) return;
    this.#sheet?.dispose();
    this.#guides?.dispose();
    this.#handleKey = '';
    this.#three = three;
    const model = three.createViewerModel(data.timeline.pattern, {
      paper: readTokenColor(this, 'paper'),
      paperBack: readTokenColor(this, 'paper-back'),
      edge: readTokenColor(this, 'paper-edge'),
      crease: readTokenColor(this, 'ink'),
      highlight: readTokenColor(this, 'ink-strong'),
      guide: readTokenColor(this, 'gray-9'),
      ghost: readTokenColor(this, 'gray-6'),
      halo: readTokenColor(this, 'ink-strong'),
    });
    this.#sheet = model.sheet;
    this.#guides = model.guides;
    this.#content = model.content;
    this.#showState();
    this.scene.setContent(model.content, { fitTo: model.sheet.group });
  }

  #showState(): void {
    const data = this.#data;
    if (!data || !this.#sheet) return;
    const index = this.foldState === 'done' ? this.#steps.length : this.stepIndex;
    this.#sheet.update(
      stateAt(data.timeline, index, this.foldState === 'done' ? 0 : this.progress),
    );
    this.#showPose();
    this.#showGuides();
  }

  /** Praesentationsdrehung anwenden und den Boden unter das Papier legen. */
  #showPose(): void {
    if (this.#content) this.#three?.applyPose(this.#content, this.#pose, this.#poseAmount);
    if (this.#sheet) this.#readyScene?.setFloor(this.#sheet.lowestZ);
  }

  /**
   * Fertiger Flieger: sanft in die Ruhelage drehen, Fluegel waagerecht, Rumpf
   * darunter. Die Faltgeometrie bleibt, gedreht wird nur die Darstellung.
   */
  #presentFinished(): void {
    const data = this.#data;
    const finished = data?.timeline.boundaries.at(-1);
    if (!data || !finished || this.#pose) return;
    this.#pose = restPose(data.timeline.pattern, finished);
    const start = performance.now();
    const tick = (now: number): void => {
      const ratio = Math.min(1, (now - start) / POSE_DURATION_MS);
      this.#poseAmount = 1 - (1 - ratio) ** 3;
      this.#showPose();
      if (ratio < 1) this.#poseFrame = requestAnimationFrame(tick);
      else this.#readyScene?.recenter();
    };
    this.#poseFrame = requestAnimationFrame(tick);
  }

  #resetPose(): void {
    cancelAnimationFrame(this.#poseFrame);
    this.#pose = undefined;
    this.#poseAmount = 0;
    this.#showPose();
  }

  #showGuides(): void {
    const data = this.#data;
    const handle = this.#currentHandle();
    const helping = this.foldState === 'ready' || this.foldState === 'dragging';
    this.#sheet?.highlight(this.#nextCreases);
    if (!data || !handle || !helping) return this.#guides?.hide();
    const folds = this.#step?.folds.length ?? 1;
    const foldProgress = this.#step?.sequential
      ? Math.min(1, this.progress * folds)
      : this.progress;
    const target = stateAt(data.timeline, this.stepIndex + 1, 0);
    const visible = { axis: true, grip: true, path: true, ghost: true };
    this.#guides?.show(handle, target, foldProgress, visible);
  }

  /**
   * Die Falten, die als Naechstes dran sind: die des aktuellen Schritts, nach
   * dem Einrasten schon die des folgenden. So bleibt die Abblendung beim
   * Weiterschalten stehen, statt kurz alle Linien aufblitzen zu lassen.
   */
  get #nextCreases(): readonly string[] {
    if (this.foldState === 'done') return [];
    const index = this.foldState === 'snapped' ? this.stepIndex + 1 : this.stepIndex;
    return this.#steps[index]?.folds.flatMap((fold) => fold.creaseIds) ?? [];
  }

  #animateTo(
    target: number,
    then?: () => void,
    motion: { readonly duration?: number; readonly easing?: Easing } = {},
  ): void {
    cancelAnimationFrame(this.#frame);
    const from = this.progress;
    const start = performance.now();
    const duration = motion.duration ?? Math.max(120, Math.abs(target - from) * DEMO_DURATION_MS);
    const easing = motion.easing ?? easeOut;
    this.foldState = 'dragging';
    const tick = (now: number): void => {
      const ratio = Math.min(1, (now - start) / duration);
      this.progress = from + (target - from) * easing(ratio);
      if (ratio < 1) this.#frame = requestAnimationFrame(tick);
      else {
        this.#settle(target >= 1 ? 'snapped' : 'ready');
        then?.();
      }
    };
    this.#frame = requestAnimationFrame(tick);
  }

  #settle(state: FoldState): void {
    this.foldState = state;
    if (state !== 'snapped') return;
    if (this.stepIndex === this.#steps.length - 1) this.#presentFinished();
    else this.#readyScene?.recenter();
  }

  #goTo(index: number): void {
    cancelAnimationFrame(this.#frame);
    clearTimeout(this.#advanceTimer);
    this.#resetPose();
    this.stepIndex = Math.min(Math.max(0, this.#steps.length - 1), Math.max(0, index));
    this.progress = 0;
    this.foldState = 'ready';
    emit(this, 'stepchange', { index: this.stepIndex, count: this.#steps.length });
    this.#fadeInGuides();
    const camera = this.#steps[this.stepIndex]?.camera;
    if (camera) this.#readyScene?.setPose(camera);
    else if (index === 0) this.#readyScene?.recenter();
  }

  /**
   * "Weiter" ist eine Aktion: den Schritt zu Ende falten und dann zum naechsten.
   * Wer schon selbst eingerastet hat, geht sofort weiter.
   */
  #next(): void {
    if (this.foldState === 'snapped') return this.#advance();
    if (this.foldState === 'done') return;
    this.motion = 'auto';
    const remaining = 1 - this.progress;
    this.#animateTo(1, () => this.#scheduleAdvance(ADVANCE_PAUSE_MS), {
      duration: Math.max(200, remaining * ADVANCE_FOLD_MS),
      easing: easeInOut,
    });
  }

  get #canGoBack(): boolean {
    return this.stepIndex > 0 || this.progress > 0 || this.foldState === 'done';
  }

  /**
   * Zurueck laeuft rueckwaerts ab: ein angefangener oder eingerasteter Schritt
   * wird entfaltet, sonst der vorige Schritt von gefaltet nach offen.
   */
  #back(): void {
    if (this.load.kind !== 'ready') return;
    clearTimeout(this.#advanceTimer);
    this.motion = 'auto';
    if (this.foldState === 'done') return this.#unfold(this.stepIndex);
    if (this.progress > 0) return this.#animateTo(0, undefined, this.#unfoldMotion(this.progress));
    if (this.stepIndex > 0) this.#unfold(this.stepIndex - 1);
  }

  #unfold(index: number): void {
    cancelAnimationFrame(this.#frame);
    this.#resetPose();
    this.stepIndex = index;
    this.progress = 1;
    emit(this, 'stepchange', { index: this.stepIndex, count: this.#steps.length });
    this.#fadeInGuides();
    const camera = this.#steps[index]?.camera;
    if (camera) this.#readyScene?.setPose(camera);
    this.#animateTo(0, undefined, this.#unfoldMotion(1));
  }

  #unfoldMotion(distance: number): { readonly duration: number; readonly easing: Easing } {
    return { duration: Math.max(200, distance * ADVANCE_FOLD_MS), easing: easeInOut };
  }

  #scheduleAdvance(pause: number): void {
    clearTimeout(this.#advanceTimer);
    this.#advanceTimer = setTimeout(() => this.#advance(), pause);
  }

  #fadeInGuides(): void {
    cancelAnimationFrame(this.#guideFrame);
    const start = performance.now();
    this.#guides?.setOpacity(0);
    const tick = (now: number): void => {
      const ratio = Math.min(1, (now - start) / GUIDE_FADE_MS);
      this.#guides?.setOpacity(easeOut(ratio));
      if (ratio < 1) this.#guideFrame = requestAnimationFrame(tick);
    };
    this.#guideFrame = requestAnimationFrame(tick);
  }

  #advance(): void {
    if (this.stepIndex === this.#steps.length - 1) {
      this.foldState = 'done';
      emit(this, 'complete', { count: this.#steps.length });
      return;
    }
    this.#goTo(this.stepIndex + 1);
  }

  #demonstrate(): void {
    if (this.foldState === 'done') return;
    this.motion = 'auto';
    this.progress = 0;
    this.#animateTo(1);
  }

  /** `lang` am Widget legt die Sprache fest (Einbettung); sonst gilt die App-Sprache. */
  static override get observedAttributes(): string[] {
    return [...super.observedAttributes, 'lang'];
  }

  override attributeChangedCallback(name: string, old: string | null, value: string | null): void {
    super.attributeChangedCallback(name, old, value);
    if (name === 'lang') this.requestUpdate();
  }

  get #locale(): Locale {
    return resolveLocale(this.getAttribute('lang'));
  }

  get #msg(): ReturnType<typeof msg> {
    return msg(this.#locale);
  }

  #failureText(error: unknown): string {
    const text = this.#msg;
    if (error instanceof TutorialLoadError) return text.loadHttp(error.status);
    if (error instanceof TutorialFormatError) return text.loadFormat(error.issues[0]?.path ?? '');
    return text.loadOther(error instanceof Error ? error.message : String(error));
  }

  get #title(): string {
    return this.#data?.tutorial.meta.title ?? 'Faltstudio';
  }

  /** Nummer des Schritts, der gerade gefaltet wird; fertig zeigt den letzten. */
  get #shownNumber(): number {
    return this.foldState === 'done' ? this.#steps.length : this.stepIndex + 1;
  }

  #renderEmbedHeader(): TemplateResult {
    return html`
      <header class="bar embed-bar">
        <p class="bar-title">
          <b>Faltstudio</b> · ${this.#title} ·
          ${this.#msg.embedStep(pad(this.stepIndex + 1), pad(this.#steps.length))}
        </p>
        <a class="open-link" href="./" target="_blank" rel="noopener">${this.#msg.openInStudio}</a>
      </header>
    `;
  }

  #renderBack(): TemplateResult {
    if (this.homeHref)
      return html`<a
        class="square back-link"
        href=${this.homeHref}
        aria-label=${this.#msg.allModels}
        >←</a
      >`;
    return html`<span class="square" aria-hidden="true"></span>`;
  }

  #toggleAid(): void {
    this.showAid = !this.showAid;
    this.menuOpen = false;
  }

  #fitCamera(): void {
    this.#readyScene?.fitContent();
    this.menuOpen = false;
  }

  #restart(): void {
    this.#goTo(0);
    this.menuOpen = false;
  }

  #renderMenu(): TemplateResult | typeof nothing {
    if (!this.menuOpen) return nothing;
    return html`
      <ul class="menu" id="viewer-menu">
        ${
          this.editHref
            ? html`<li><a class="menu-item" href=${this.editHref}>${this.#msg.edit}</a></li>`
            : nothing
        }
        <li>
          <button
            class="menu-item"
            type="button"
            aria-pressed=${this.showAid ? 'true' : 'false'}
            @click=${() => this.#toggleAid()}
          >
            ${this.#msg.readingAid}
          </button>
        </li>
        <li>
          <button class="menu-item" type="button" @click=${() => this.#fitCamera()}>
            ${this.#msg.fitCamera}
          </button>
        </li>
        <li>
          <button class="menu-item" type="button" @click=${() => this.#restart()}>
            ${this.#msg.restart}
          </button>
        </li>
        <li class="menu-locale"><fl-locale-switch></fl-locale-switch></li>
      </ul>
    `;
  }

  #renderHeader(): TemplateResult {
    if (this.embedded) return this.#renderEmbedHeader();
    const count = this.#steps.length;
    return html`
      <header class="bar">
        ${this.#renderBack()}
        <p class="bar-title">
          <b class="brand">Faltstudio</b>
          <span class="kicker">${this.#title} · ${pad(this.#shownNumber)} / ${pad(count)}</span>
        </p>
        <nav
          class="bar-actions"
          aria-label=${this.#msg.viewerNav}
          @keydown=${(event: KeyboardEvent) => event.key === 'Escape' && (this.menuOpen = false)}
        >
          ${this.editHref ? html`<a class="bar-link" href=${this.editHref}>${this.#msg.edit}</a>` : nothing}
          <button
            class="square"
            type="button"
            aria-label=${this.#msg.menu}
            aria-expanded=${this.menuOpen ? 'true' : 'false'}
            aria-controls="viewer-menu"
            @click=${() => (this.menuOpen = !this.menuOpen)}
          >
            ⋯
          </button>
          ${this.#renderMenu()}
        </nav>
      </header>
    `;
  }

  #renderStage(): TemplateResult {
    return html`
      <div class="stage">
        <fl-scene class="scene" label=${this.#msg.scene}></fl-scene>
        <p class="index" aria-hidden="true">${pad(this.#shownNumber)}</p>
        ${
          this.embedded
            ? html`<p class="embed-hint">
                <b>${this.#step?.title ?? ''}</b><br />${this.#msg.embedHint}
              </p>`
            : this.showAid
              ? html`<div class="reading-aid">
                  <fl-panel heading=${this.#msg.readingAid} level="2" marks
                    >${this.#renderReadingAid()}</fl-panel
                  >
                </div>`
              : nothing
        }
      </div>
    `;
  }

  #renderReadingAid(): TemplateResult {
    const aid = this.#msg.aid;
    return html`
      <ul class="aid">
        <li><span class="aid-mark grip" aria-hidden="true"></span>${aid.grip}</li>
        <li><span class="aid-mark axis" aria-hidden="true"></span>${aid.axis}</li>
        <li><span class="aid-mark ghost" aria-hidden="true"></span>${aid.ghost}</li>
        <li><span class="aid-mark path" aria-hidden="true"></span>${aid.path}</li>
      </ul>
    `;
  }

  /** Wechselt mit dem Schritt: Text wird dann neu eingeblendet statt hart ersetzt. */
  get #stepKey(): string {
    return this.foldState === 'done' ? 'done' : String(this.stepIndex);
  }

  #renderChip(): TemplateResult | typeof nothing {
    if (this.load.kind !== 'ready') return nothing;
    const settled = this.foldState === 'snapped' || this.foldState === 'done';
    return html`<p class=${settled ? 'state-chip settled' : 'state-chip'}>
      <span aria-hidden="true"
        >${chipLabel(this.foldState, this.motion, this.#angle, this.#locale)}</span
      >
      <span class="sr" role="status">${this.#msg.state[this.foldState]}</span>
    </p>`;
  }

  #renderHintText(): TemplateResult {
    if (this.load.kind === 'failed')
      return html`<h1 class="step-title">${this.#msg.loadFailed}</h1>
        <p class="step-text">${this.#failureText(this.load.error)}</p>`;
    if (this.load.kind !== 'ready') return html`<h1 class="step-title">${this.#msg.loading}</h1>`;
    const done = this.foldState === 'done';
    const title = done ? this.#msg.doneTitle : (this.#step?.title ?? '');
    const text = done ? this.#msg.doneText : (this.#step?.text ?? '');
    const key = this.#stepKey;
    return html`
      ${keyed(key, html`<h1 class="step-title enter">${title}</h1>`)}
      ${keyed(key, html`<p class="step-text enter">${text}</p>`)}
    `;
  }

  #renderHint(): TemplateResult {
    return html`
      <section class="hint" aria-live="polite">
        ${keyed(
          this.#stepKey,
          html`<p class="caption enter">
            ${this.#msg.stepOf(pad(this.stepIndex + 1), pad(this.#steps.length))}
          </p>`,
        )}
        ${this.#renderChip()} ${this.#renderHintText()}
      </section>
    `;
  }

  #renderPrimary(): TemplateResult {
    if (this.foldState === 'done') {
      return html`<fl-button variant="primary" size="large" trailing @click=${() => this.#goTo(0)}
        >${this.#msg.again}<span slot="end">↺</span></fl-button
      >`;
    }
    const snapped = this.foldState === 'snapped';
    return html`<fl-button
      class=${snapped ? 'next' : 'next pending'}
      variant=${snapped ? 'primary' : 'secondary'}
      size="large"
      trailing
      ?disabled=${this.load.kind !== 'ready'}
      @click=${() => this.#next()}
      >${this.#msg.next}<span slot="end">→</span></fl-button
    >`;
  }

  /** Strichleiste: ein Segment je Schritt, erledigte voll, der aktuelle anteilig. */
  #renderTicks(): TemplateResult {
    const count = this.#steps.length;
    const position = this.#position;
    return html`<div
      class="ticks"
      role="progressbar"
      aria-label=${this.#msg.progress}
      aria-valuemin="0"
      aria-valuemax=${count}
      aria-valuenow=${Math.floor(position)}
      aria-valuetext=${this.#msg.stepOf(pad(this.#shownNumber), pad(count))}
    >
      ${this.#steps.map((step, index) => {
        const fill = Math.min(1, Math.max(0, position - index));
        return html`<span class="tick" title=${step.title}
          ><span
            class="tick-fill"
            style=${styleMap({ inlineSize: `${(fill * 100).toFixed(1)}%` })}
          ></span
        ></span>`;
      })}
    </div>`;
  }

  #renderControls(): TemplateResult {
    return html`
      ${this.#renderTicks()}
      <nav class="controls" aria-label=${this.#msg.controls}>
        <fl-button
          class="back"
          size="large"
          square
          accessibility-label=${this.#msg.back}
          ?disabled=${!this.#canGoBack}
          @click=${() => this.#back()}
          >←</fl-button
        >
        <span class="primary">${this.#renderPrimary()}</span>
        <fl-button
          class="demo"
          size="large"
          square
          accessibility-label=${this.#msg.demonstrate}
          ?disabled=${this.load.kind !== 'ready'}
          @click=${() => this.#demonstrate()}
          >▶</fl-button
        >
      </nav>
    `;
  }

  protected override render(): TemplateResult {
    return html`
      ${this.#renderHeader()} ${this.#renderStage()}
      <footer class="dock">
        ${this.embedded ? nothing : this.#renderHint()}
        <div class="dock-controls">${this.#renderControls()}</div>
      </footer>
    `;
  }
}
