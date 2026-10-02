import { html, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { state } from 'lit/decorators.js';
import { keyed } from 'lit/directives/keyed.js';
import { styleMap } from 'lit/directives/style-map.js';
import { parseTutorial, TutorialFormatError } from '@faltstudio/core';
import { BaseElement } from '@faltstudio/ui';
import { startText } from '../../i18n/start.js';
import { EXAMPLES } from '../../state/examples.js';
import { pickTextFile } from '../../state/files.js';
import {
  createModelId,
  deleteModel,
  listModels,
  saveModel,
  type StoredModel,
} from '../../state/library.js';
import { editorHref, viewHref } from '../../state/route.js';
import { ViewportController } from '../../state/viewport.js';
import { clampSelection, fanPlacement } from './fan-layout.js';
import { exampleInfo, modelInfo, newSheetInfo, pad, type FanInfo } from './fan-info.js';
import { fanItems, routeOf, type FanItem } from './fan-items.js';
import { cardData, displayTitle, type CardData } from './model-card-data.js';
import { renderModelOverlay, type OverlayView } from './model-overlay.js';
import { modelStatus, type ModelStatus } from './model-status.js';
import { startPageStyles } from './start-page.styles.js';

interface CardOverlay {
  readonly id: string;
  readonly view: OverlayView;
}

/** So lange muss eine Auswahl stehen, bis ihr 3D-Modell gerechnet wird (Ueberfahren). */
const BACKDROP_DELAY_MS = 250;

/** Ab dieser Wischstrecke (px) wechselt das Blatt. */
const SWIPE_PX = 30;
const PICKER_HASH = '#neu';

/**
 * Startseite im Redesign „Tisch & Papier“ (Design R1, R2, D1): die eigenen
 * Modelle liegen als Faecher von Papierblaettern auf dem Tisch, das gewaehlte
 * hebt sich. Das letzte Blatt ist ein neues; „Anlegen“ fuehrt zur Startart
 * (R3, `#neu`).
 */
export class StartPage extends BaseElement {
  static override styles = [BaseElement.styles, startPageStyles];

  @state() private models: readonly StoredModel[] | undefined;
  @state() private selected = 0;
  @state() private overlay: CardOverlay | undefined;
  @state() private picking = location.hash === PICKER_HASH;
  @state() private message = '';
  /** Blatt, dessen 3D-Ansicht hinter dem Faecher liegt; folgt `selected` verzoegert. */
  @state() private backdropKey: string | undefined;

  readonly #viewport = new ViewportController(this);
  readonly #cards = new Map<string, CardData>();
  readonly #statuses = new Map<string, ModelStatus>();
  #swipeStart: number | undefined;
  #swiped = false;
  #focusAfterUpdate = false;
  #pushedPicker = false;
  #backdropTimer: ReturnType<typeof setTimeout> | undefined;

  readonly #onHashChange = (): void => {
    this.picking = location.hash === PICKER_HASH;
  };

  override connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener('hashchange', this.#onHashChange);
    void this.#refresh();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener('hashchange', this.#onHashChange);
    clearTimeout(this.#backdropTimer);
  }

  protected override updated(changed: PropertyValues): void {
    if (changed.has('selected') || changed.has('models')) this.#scheduleBackdrop();
    if (!changed.has('selected') || !this.#focusAfterUpdate) return;
    this.#focusAfterUpdate = false;
    this.renderRoot
      .querySelector<HTMLElement>('.sheet[tabindex="0"]')
      ?.focus({ preventScroll: true });
  }

  /** Eigene Modelle, Beispiele und das neue Blatt in Faecher-Reihenfolge. */
  get #items(): readonly FanItem[] {
    return fanItems(this.models ?? [], EXAMPLES);
  }

  #scheduleBackdrop(): void {
    clearTimeout(this.#backdropTimer);
    const key = this.#items[this.selected]?.key;
    this.#backdropTimer = setTimeout(() => (this.backdropKey = key), BACKDROP_DELAY_MS);
  }

  /** Das gewaehlte Blatt gefaltet und drehend im Hintergrund; Ziehen dreht es von Hand. */
  #renderBackdrop(items: readonly FanItem[]): TemplateResult | typeof nothing {
    const item = items.find((entry) => entry.key === this.backdropKey);
    if (!item || item.kind === 'new') return nothing;
    return html`<div class="backdrop" aria-hidden="true">
      ${keyed(item.key, html`<fl-model-turntable interactive .text=${item.text}></fl-model-turntable>`)}
    </div>`;
  }

  async #refresh(): Promise<void> {
    this.models = await listModels();
    this.selected = Math.min(this.selected, this.#items.length - 1);
  }

  #card(text: string): CardData {
    const known = this.#cards.get(text);
    if (known) return known;
    const data = cardData(text, '');
    this.#cards.set(text, data);
    return data;
  }

  #status(text: string): ModelStatus {
    const known = this.#statuses.get(text);
    if (known) return known;
    const status = modelStatus(text);
    this.#statuses.set(text, status);
    return status;
  }

  async #handleImport(): Promise<void> {
    try {
      const text = await pickTextFile();
      if (text === undefined) return;
      const tutorial = parseTutorial(text);
      const id = createModelId();
      await saveModel({
        id,
        title: tutorial.meta.title,
        updatedAt: new Date().toISOString(),
        text,
      });
      location.href = editorHref({ kind: 'model', id });
    } catch (error) {
      const detail =
        error instanceof TutorialFormatError
          ? ` (${error.issues[0]?.path ?? ''}: ${error.issues[0]?.message ?? ''})`
          : '';
      const reason = `${error instanceof Error ? error.message : String(error)}${detail}`;
      this.message = startText().fileUnreadable(reason);
    }
  }

  async #handleDelete(id: string): Promise<void> {
    this.overlay = undefined;
    await deleteModel(id);
    await this.#refresh();
  }

  #handleOpenPicker(): void {
    this.#pushedPicker = true;
    location.hash = PICKER_HASH;
  }

  #handleClosePicker(): void {
    if (this.#pushedPicker) {
      this.#pushedPicker = false;
      history.back();
      return;
    }
    history.replaceState(null, '', location.pathname + location.search);
    this.picking = false;
  }

  #select(index: number, focus = false): void {
    const count = this.#items.length;
    this.selected = clampSelection(index, 0, count);
    this.#focusAfterUpdate = focus;
  }

  #handleSheetClick(index: number): void {
    if (this.#swiped) {
      this.#swiped = false;
      return;
    }
    if (index !== this.selected) return this.#select(index);
    const item = this.#items[index];
    if (!item || item.kind === 'new') return this.#handleOpenPicker();
    location.href = viewHref(routeOf(item));
  }

  #handleFanKey(event: KeyboardEvent): void {
    const count = this.#items.length;
    const moves: Readonly<Record<string, number>> = {
      ArrowLeft: this.selected - 1,
      ArrowRight: this.selected + 1,
      Home: 0,
      End: count - 1,
    };
    const target = moves[event.key];
    if (target === undefined) return;
    event.preventDefault();
    this.#select(target, true);
  }

  #handleSwipeStart(event: PointerEvent): void {
    this.#swipeStart = event.clientX;
    this.#swiped = false;
  }

  #handleSwipeEnd(event: PointerEvent): void {
    const start = this.#swipeStart;
    this.#swipeStart = undefined;
    if (start === undefined) return;
    const distance = event.clientX - start;
    if (Math.abs(distance) <= SWIPE_PX) return;
    this.#swiped = true;
    this.#select(this.selected + (distance < 0 ? 1 : -1));
  }

  #handleSheetHover(event: PointerEvent, index: number): void {
    if (event.pointerType === 'mouse' && !this.#viewport.mobile) this.#select(index);
  }

  #info(items: readonly FanItem[]): FanInfo {
    const item = items[this.selected];
    const models = this.models ?? [];
    if (!item || item.kind === 'new') return newSheetInfo(items.length - 1);
    if (item.kind === 'example')
      return exampleInfo({
        position: item.position,
        fanPosition: this.selected,
        total: EXAMPLES.length,
        data: this.#card(item.text),
      });
    return modelInfo({
      position: this.selected,
      total: models.length,
      data: this.#card(item.text),
      status: this.#status(item.text),
      updatedAt: item.model.updatedAt,
    });
  }

  #renderPaper(item: Exclude<FanItem, { kind: 'new' }>, index: number): TemplateResult {
    const data = this.#card(item.text);
    const failed = item.kind === 'model' && this.#status(item.text).kind === 'error';
    return html`
      <fl-crease-canvas
        mini
        label=${startText().patternOf(displayTitle(data))}
        .lines=${data.lines}
        .highlighted=${data.lines.map((line) => line.id)}
      ></fl-crease-canvas>
      <span class="sheet-number" aria-hidden="true">${pad(index + 1)}</span>
      ${failed ? html`<span class="sheet-error" aria-hidden="true">✕</span>` : nothing}
      ${
        item.kind === 'example'
          ? html`<span class="sheet-example" aria-hidden="true">${startText().exampleBadge}</span>`
          : nothing
      }
    `;
  }

  #renderSheet(item: FanItem, index: number, count: number): TemplateResult {
    const place = fanPlacement(index, this.selected, count);
    const lifted = index === this.selected;
    const classes = [
      'sheet',
      item.kind === 'new' ? 'blank' : 'paper',
      lifted ? 'lifted' : '',
      place.hiddenMobile ? 'far-mobile' : '',
      place.hiddenDesktop ? 'far-desktop' : '',
    ].join(' ');
    const label =
      item.kind === 'new'
        ? startText().newSheet
        : `${pad(index + 1)} ${displayTitle(this.#card(item.text))}${item.kind === 'example' ? ` · ${startText().exampleBadge}` : ''}`;
    return html`<li
      class="slot"
      style=${styleMap({
        '--fan-shift': String(place.shift),
        '--fan-spread': String(place.spread),
        '--fan-z-mobile': String(place.zMobile),
        '--fan-z-desktop': String(place.zDesktop),
      })}
    >
      <button
        class=${classes}
        type="button"
        tabindex=${lifted ? 0 : -1}
        aria-pressed=${lifted ? 'true' : 'false'}
        aria-label=${label}
        @click=${() => this.#handleSheetClick(index)}
        @pointerenter=${(event: PointerEvent) => this.#handleSheetHover(event, index)}
      >
        ${
          item.kind === 'new'
            ? html`<span class="blank-plus" aria-hidden="true">+</span
                ><span class="blank-label">${startText().newSheet}</span>`
            : this.#renderPaper(item, index)
        }
      </button>
    </li>`;
  }

  #renderFan(items: readonly FanItem[]): TemplateResult {
    const count = items.length;
    const sheets = items;
    return html`
      <div
        class="fan-area"
        @pointerdown=${this.#handleSwipeStart}
        @pointerup=${this.#handleSwipeEnd}
        @pointercancel=${() => (this.#swipeStart = undefined)}
      >
        <ul class="fan" aria-label=${startText().models} @keydown=${this.#handleFanKey}>
          ${sheets.map((item, index) => this.#renderSheet(item, index, count))}
        </ul>
      </div>
      <ol class="ticks" aria-hidden="true">
        ${sheets.map((_, index) => html`<li class=${index === this.selected ? 'tick on' : 'tick'}></li>`)}
      </ol>
    `;
  }

  #renderInfo(info: FanInfo, item: FanItem): TemplateResult {
    return html`
      <section class="info" aria-labelledby="current-title">
        <p class="index" aria-hidden="true">${info.index}</p>
        <div class="info-text" aria-live="polite">
          <p class="kicker">${info.kicker}</p>
          <h2 class="current-title" id="current-title">${info.title}</h2>
          <p class="meta">${info.meta}</p>
          <div class="info-actions">
            <span class="desktop-actions">
              ${this.#renderPrimary(item)} ${this.#renderSecondary(item)}
            </span>
            ${this.#renderTextAction(item, info.title)}
          </div>
        </div>
      </section>
    `;
  }

  /** Neben den Buttons: Menue zum eigenen Modell, beim neuen Blatt mobil „Datei öffnen“. */
  #renderTextAction(item: FanItem, title: string): TemplateResult | typeof nothing {
    const text = startText();
    if (item.kind === 'example') return nothing;
    if (item.kind === 'new')
      return html`<button
        class="text-action mobile-only"
        type="button"
        @click=${() => void this.#handleImport()}
      >
        ${text.openFile}
      </button>`;
    const id = item.model.id;
    return html`<button
      class="text-action"
      type="button"
      aria-label=${text.moreAbout(title)}
      @click=${() => (this.overlay = { id, view: 'menu' })}
    >
      ${text.more}
    </button>`;
  }

  #renderPrimary(item: FanItem | undefined): TemplateResult {
    if (!item || item.kind === 'new')
      return html`<button class="primary" type="button" @click=${() => this.#handleOpenPicker()}>
        ${startText().create} <span aria-hidden="true">→</span>
      </button>`;
    const label = item.kind === 'example' ? startText().editCopy : startText().edit;
    return html`<a class="primary" href=${editorHref(routeOf(item))}
      >${label} <span aria-hidden="true">→</span></a
    >`;
  }

  #renderSecondary(item: FanItem | undefined): TemplateResult {
    if (!item || item.kind === 'new')
      return html`<a class="secondary" href=${editorHref({ kind: 'new' }, 'photo')}
        >${startText().fromPhoto}</a
      >`;
    return html`<a class="secondary" href=${viewHref(routeOf(item))}>${startText().open}</a>`;
  }

  #renderBottomBar(items: readonly FanItem[]): TemplateResult {
    const item = items[this.selected];
    return html`<nav class="bottom-bar mobile-only" aria-label=${startText().actions}>
      <button
        class="plus"
        type="button"
        aria-label=${startText().newModel}
        @click=${() => this.#select(items.length - 1, true)}
      >
        +
      </button>
      ${this.#renderSecondary(item)} ${this.#renderPrimary(item)}
    </nav>`;
  }

  #renderOverview(): TemplateResult {
    const items = this.#items;
    const item = items[this.selected] ?? (items.at(-1) as FanItem);
    return html`
      <main class="overview">
        <p class="watermark" aria-hidden="true">
          <span class="mobile-only">${startText().watermarkMobile}</span
          ><span class="desktop-only">Faltstudio</span>
        </p>
        ${this.#renderBackdrop(items)} ${this.#renderInfo(this.#info(items), item)}
        ${this.#renderFan(items)}
      </main>
      ${this.#renderBottomBar(items)}
    `;
  }

  /** Leerer Zustand (R2), nur ohne Modelle und ohne Beispiele: ein gestricheltes Blatt als Einstieg. */
  #renderEmpty(): TemplateResult {
    const example = EXAMPLES[0];
    const text = startText();
    return html`
      <main class="overview empty">
        <section class="info" aria-labelledby="current-title">
          <p class="index dim" aria-hidden="true">00</p>
          <div class="info-text">
            <h2 class="current-title" id="current-title">
              ${text.empty.titleFirst}<br />${text.empty.titleSecond}
            </h2>
            <p class="lead">${text.empty.lead}</p>
            <span class="desktop-actions">
              ${this.#renderPrimary(undefined)} ${this.#renderSecondary(undefined)}
            </span>
          </div>
        </section>
        <div class="empty-table">
          <span class="ghost left" aria-hidden="true"></span>
          <span class="ghost right" aria-hidden="true"></span>
          <button class="first-sheet" type="button" @click=${() => this.#handleOpenPicker()}>
            <span class="blank-plus" aria-hidden="true">+</span>
            <span class="blank-label">${text.empty.firstFirst}<br />${text.empty.firstSecond}</span>
          </button>
          ${
            example
              ? html`<a class="example-link" href=${editorHref({ kind: 'example', id: example.id })}
                  >${text.empty.example}</a
                >`
              : nothing
          }
        </div>
      </main>
      <nav class="bottom-bar two" aria-label=${text.actions}>
        <a class="secondary" href=${editorHref({ kind: 'new' }, 'photo')}>${text.fromPhoto}</a>
        <button class="primary" type="button" @click=${() => this.#handleOpenPicker()}>
          ${text.newModel} <span aria-hidden="true">→</span>
        </button>
      </nav>
    `;
  }

  #renderOverlay(): TemplateResult | typeof nothing {
    const overlay = this.overlay;
    const model = this.models?.find((entry) => entry.id === overlay?.id);
    if (!overlay || !model) return nothing;
    return renderModelOverlay(
      {
        model,
        data: this.#card(model.text),
        view: overlay.view,
        onView: (view) => (this.overlay = { id: model.id, view }),
        onClose: () => (this.overlay = undefined),
        onDelete: () => void this.#handleDelete(model.id),
      },
      !this.#viewport.mobile,
    );
  }

  #renderBar(count: number): TemplateResult {
    const text = startText();
    return html`<header class="bar">
      <p class="brand-line">
        <span class="brand">Faltstudio</span>
        ${count > 0 ? html`<span class="model-count">${text.modelCount(pad(count))}</span>` : nothing}
      </p>
      <fl-locale-switch class="locale"></fl-locale-switch>
      <nav class="bar-actions desktop-only" aria-label=${text.fileActions}>
        <button class="text-action" type="button" @click=${() => void this.#handleImport()}>
          ${text.openFile}
        </button>
        <button class="plus wide" type="button" @click=${() => this.#handleOpenPicker()}>
          <span aria-hidden="true">+</span>${text.newShort}
        </button>
      </nav>
    </header>`;
  }

  #renderContent(): TemplateResult {
    const models = this.models;
    if (models === undefined) return html`<main class="overview" aria-busy="true"></main>`;
    const nothingToShow = models.length === 0 && EXAMPLES.length === 0;
    return nothingToShow ? this.#renderEmpty() : this.#renderOverview();
  }

  protected override render(): TemplateResult {
    if (this.picking)
      return html`<fl-start-picker @back=${() => this.#handleClosePicker()}></fl-start-picker>`;
    return html`
      <div class="page">
        <h1 class="hidden">${startText().pageTitle}</h1>
        ${this.#renderBar(this.models?.length ?? 0)}
        ${this.message ? html`<p class="notice" role="alert">${this.message}</p>` : nothing}
        ${this.#renderContent()}
      </div>
      ${this.#renderOverlay()}
    `;
  }
}
