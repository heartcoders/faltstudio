import { html, nothing, svg, type SVGTemplateResult, type TemplateResult } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import {
  SHEET_A4,
  SHEET_LETTER,
  quadMetrics,
  type Quad,
  type Reference,
  type Sheet,
} from '@faltstudio/core';
import { BaseElement, boolProp, emit } from '@faltstudio/ui';
import type { Editor } from '../../state/editor.js';
import { pickFile } from '../../state/files.js';
import { StoreController } from '../../state/store-controller.js';
import { workspaceStyles } from '../../styles/workspace.js';
import { effectiveCorners, pixelLabel, targetRect, type Point } from './photo-geometry.js';
import { mobileStyles } from '../mobile/mobile.styles.js';
import { editorText } from '../../i18n/editor.js';
import { modePhotoStyles } from './mode-photo.styles.js';

type TargetFormat = 'a4' | 'letter';

const FORMATS: Readonly<Record<TargetFormat, Sheet>> = { a4: SHEET_A4, letter: SHEET_LETTER };
const HANDLE_NAMES = ['P1', 'P2', 'P3', 'P4'] as const;
const HIT_PX = 30;
/** Fingerbreite: auf Beruehrung greifen die Griffe weiter. */
const TOUCH_HIT_PX = 44;

/**
 * Modus 01 Foto (S1): Foto des entfalteten Blatts laden, vier Ecken setzen,
 * Perspektive entzerren. Die Vorlage erscheint danach unter der Zeichenflaeche.
 *
 * @fires apply - "Entzerrung anwenden": zur Zeichenflaeche wechseln.
 */
export class ModePhoto extends BaseElement {
  static override styles = [BaseElement.styles, workspaceStyles, mobileStyles, modePhotoStyles];

  @property({ attribute: false }) editor!: Editor;
  /** Mobil (M7): Foto vollflaechig, Lupe nur beim Ziehen, Einstellungen im Sheet. */
  @boolProp() mobile = false;
  @state() private dragging = false;
  @query('.photo-view') private view?: SVGSVGElement | null;

  #observed = false;
  #dragging: number | undefined;

  override connectedCallback(): void {
    super.connectedCallback();
    if (this.#observed) return;
    this.#observed = true;
    new StoreController(this, this.editor.document, this.editor.ui);
  }

  get #reference(): Reference | undefined {
    return this.editor.document.get().reference;
  }

  get #corners(): readonly Point[] {
    const reference = this.#reference;
    return reference ? effectiveCorners(reference, this.editor.ui.get().cornerDraft) : [];
  }

  async #load(capture?: 'environment'): Promise<void> {
    try {
      const file = await pickFile('image/*', capture);
      if (file) await this.editor.importPhoto(file);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.editor.updateUi({ message: editorText().messages.photoUnreadable(reason) });
    }
  }

  #toImage(
    event: PointerEvent,
  ): { readonly point: Point; readonly pxPerScreen: number } | undefined {
    const matrix = this.view?.getScreenCTM();
    if (!matrix) return undefined;
    const local = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    return { point: [local.x, local.y], pxPerScreen: 1 / matrix.a };
  }

  #onDown(event: PointerEvent): void {
    const hit = this.#toImage(event);
    if (!hit) return;
    const distances = this.#corners.map((corner) =>
      Math.hypot(corner[0] - hit.point[0], corner[1] - hit.point[1]),
    );
    const nearest = distances.indexOf(Math.min(...distances));
    const radius = event.pointerType === 'touch' ? TOUCH_HIT_PX : HIT_PX;
    if ((distances[nearest] ?? Infinity) > radius * hit.pxPerScreen) return;
    event.preventDefault();
    this.#dragging = nearest;
    this.dragging = true;
    (event.currentTarget as Element).setPointerCapture(event.pointerId);
    this.editor.dragCorner(nearest, this.#corners[nearest] as Point);
  }

  #onMove(event: PointerEvent): void {
    const hit = this.#dragging === undefined ? undefined : this.#toImage(event);
    if (hit && this.#dragging !== undefined) this.editor.dragCorner(this.#dragging, hit.point);
  }

  #onUp(): void {
    if (this.#dragging === undefined) return;
    this.#dragging = undefined;
    this.dragging = false;
    this.editor.commitCorner();
  }

  #onKey(event: KeyboardEvent): void {
    const active = this.editor.ui.get().activeCorner;
    if (event.key === 'Tab') return this.#cycle(event, active);
    const step = event.shiftKey ? 10 : 1;
    const moves: Readonly<Record<string, Point>> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    this.editor.nudgeCorner(active, move[0], move[1]);
  }

  #cycle(event: KeyboardEvent, active: number): void {
    const next = active + (event.shiftKey ? -1 : 1);
    if (next < 0 || next > 3) return;
    event.preventDefault();
    this.editor.updateUi({ activeCorner: next });
  }

  #renderHandle(corner: Point, index: number, scale: number): SVGTemplateResult {
    const [x, y] = corner;
    const active = index === this.editor.ui.get().activeCorner;
    const right = index === 1 || index === 2;
    const below = index >= 2;
    const labelX = right ? x + 26 * scale : x - 136 * scale;
    const labelY = below ? y + 30 * scale : y - 22 * scale;
    return svg`
      ${active ? svg`<circle class="halo" cx=${x} cy=${y} r=${20 * scale}></circle>` : nothing}
      <circle class="handle" cx=${x} cy=${y} r=${9 * scale}></circle>
      <path class="handle-cross" d="M${x - 20 * scale} ${y}H${x - 11 * scale}M${x + 11 * scale} ${y}H${x + 20 * scale}M${x} ${y - 20 * scale}V${y - 11 * scale}M${x} ${y + 11 * scale}V${y + 20 * scale}"></path>
      <rect class=${active ? 'tag active' : 'tag'} x=${labelX} y=${labelY - 14 * scale} width=${112 * scale} height=${20 * scale}></rect>
      <text class=${active ? 'tag-text active' : 'tag-text'} x=${labelX + 7 * scale} y=${labelY} font-size=${10 * scale}>${HANDLE_NAMES[index]} · ${pixelLabel(corner)}</text>
    `;
  }

  #renderPhoto(reference: Reference): TemplateResult {
    const [width, height] = reference.size;
    const scale = Math.max(width, height) / 800;
    const corners = this.#corners;
    const target = targetRect(corners, this.editor.document.get().sheet);
    const opacity = this.editor.ui.get().opacityDraft ?? reference.opacity;
    return html`
      <svg
        class="photo-view"
        viewBox="0 0 ${width} ${height}"
        tabindex="0"
        role="application"
        aria-label=${editorText().photo.viewLabel}
        style=${styleMap({ '--photo-opacity': String(opacity) })}
        @pointerdown=${(event: PointerEvent) => this.#onDown(event)}
        @pointermove=${(event: PointerEvent) => this.#onMove(event)}
        @pointerup=${() => this.#onUp()}
        @pointercancel=${() => this.#onUp()}
        @keydown=${(event: KeyboardEvent) => this.#onKey(event)}
      >
        <image class="photo" href=${reference.imageDataUrl} width=${width} height=${height}></image>
        <rect
          class="target"
          x=${target.x}
          y=${target.y}
          width=${target.width}
          height=${target.height}
        ></rect>
        <polygon
          class="quad"
          points=${corners.map((corner) => corner.join(',')).join(' ')}
        ></polygon>
        ${corners.map((corner, index) => this.#renderHandle(corner, index, scale))}
      </svg>
    `;
  }

  #renderEmpty(): TemplateResult {
    return html`
      <div class="empty">
        <p class="caption">${editorText().photo.emptyCaption}</p>
        <fl-button variant="primary" size="large" @click=${() => void this.#load()}
          >${editorText().photo.loadPhoto}</fl-button
        >
      </div>
    `;
  }

  #renderLoupe(reference: Reference | undefined): TemplateResult {
    const active = this.editor.ui.get().activeCorner;
    const corner = this.#corners[active];
    if (!reference || !corner)
      return html`<div class="pad"><span class="loupe" aria-hidden="true"></span></div>`;
    const radius = Math.max(...reference.size) / 40;
    return html`
      <div class="pad">
        <svg
          class="loupe"
          viewBox="${corner[0] - radius} ${corner[1] - radius} ${radius * 2} ${radius * 2}"
          aria-label=${editorText().photo.loupe(HANDLE_NAMES[active] ?? '')}
          role="img"
        >
          <image
            href=${reference.imageDataUrl}
            width=${reference.size[0]}
            height=${reference.size[1]}
          ></image>
          <path
            class="loupe-cross"
            d="M${corner[0] - radius} ${corner[1]}H${corner[0] + radius}M${corner[0]} ${corner[1] - radius}V${corner[1] + radius}"
          ></path>
          <circle class="loupe-ring" cx=${corner[0]} cy=${corner[1]} r=${radius / 8}></circle>
        </svg>
        <p class="caption">${pixelLabel(corner).replace('/', ' / ')} px</p>
      </div>
    `;
  }

  #renderChecks(reference: Reference): TemplateResult {
    const sheet = this.editor.document.get().sheet;
    const metrics = quadMetrics(this.#corners as unknown as Quad);
    if (!metrics.convex) return html`<p class="hint warn">${editorText().photo.swapped}</p>`;
    const target = sheet.height / sheet.width;
    return html`<p class="hint">
      ${editorText().photo.checks(
        metrics.skew.toFixed(1),
        metrics.ratio.toFixed(2),
        target.toFixed(2),
        `${reference.size[0]} × ${reference.size[1]}`,
      )}
    </p>`;
  }

  #renderContext(reference: Reference | undefined): TemplateResult {
    const sheet = this.editor.document.get().sheet;
    const format: TargetFormat = sheet.width === SHEET_LETTER.width ? 'letter' : 'a4';
    const opacity = this.editor.ui.get().opacityDraft ?? reference?.opacity ?? 0.62;
    const msg = editorText().photo;
    return html`
      <aside class="context" aria-label=${msg.title}>
        <section>
          <h2>${msg.title}</h2>
          ${reference ? html`<img class="thumb" src=${reference.imageDataUrl} alt="" />` : nothing}
          <div class="row">
            <fl-button size="small" @click=${() => void this.#load()}
              >${reference ? msg.replace : msg.load}</fl-button
            >
            ${reference ? html`<fl-button size="small" variant="tertiary" @click=${() => this.editor.removePhoto()}>${msg.remove}</fl-button>` : nothing}
          </div>
          ${reference ? this.#renderChecks(reference) : html`<p class="hint">${msg.emptyHint}</p>`}
        </section>
        <section>
          <h2>${msg.opacityHeading(Math.round(opacity * 100))}</h2>
          <fl-slider
            label=${msg.opacity}
            unit="%"
            .value=${Math.round(opacity * 100)}
            ?disabled=${!reference}
            @input=${(event: CustomEvent<number>) => this.editor.setOpacity(event.detail / 100, false)}
            @change=${(event: CustomEvent<number>) => this.editor.setOpacity(event.detail / 100, true)}
          ></fl-slider>
        </section>
        <section>
          <h2>${msg.sheet}</h2>
          <fl-segmented
            label=${msg.sheetFormat}
            fill
            .value=${format}
            @change=${(event: CustomEvent<TargetFormat>) => {
              if (!this.editor.setSheet(FORMATS[event.detail])) this.requestUpdate();
            }}
          >
            <fl-segment value="a4">A4</fl-segment>
            <fl-segment value="letter">${msg.letter}</fl-segment>
          </fl-segmented>
        </section>
        <p class="hint">${msg.keys}</p>
        <fl-button
          variant="primary"
          trailing
          ?disabled=${!reference}
          @click=${() => emit(this, 'apply')}
          >${msg.apply}<span slot="end">→</span></fl-button
        >
      </aside>
    `;
  }

  #renderFormatTabs(format: TargetFormat): TemplateResult {
    const msg = editorText().photo;
    const labels: Readonly<Record<TargetFormat, string>> = { a4: 'A4', letter: msg.letter };
    return html`<div class="format-row">
      <span class="caption">${msg.format}</span>
      <div class="format-tabs" role="group" aria-label=${msg.sheetFormat}>
        ${(Object.keys(labels) as TargetFormat[]).map(
          (key) =>
            html`<button
              class="format-tab"
              type="button"
              aria-pressed=${key === format ? 'true' : 'false'}
              @click=${() => {
                if (key !== format && !this.editor.setSheet(FORMATS[key])) this.requestUpdate();
              }}
            >
              ${labels[key]}
            </button>`,
        )}
      </div>
    </div>`;
  }

  /** Karte „Foto ausrichten“ (R7): Deckkraft, Format, Erkennung, Primaeraktion. */
  #renderMobileSheet(reference: Reference | undefined): TemplateResult {
    const sheet = this.editor.document.get().sheet;
    const format: TargetFormat = sheet.width === SHEET_LETTER.width ? 'letter' : 'a4';
    const opacity = this.editor.ui.get().opacityDraft ?? reference?.opacity ?? 0.62;
    const msg = editorText().photo;
    return html`
      <fl-sheet level="half" label=${msg.title}>
        <div slot="head" class="photo-head">
          <h2 class="card-title">${reference ? msg.align : msg.choose}</h2>
          <div class="photo-actions">
            <button
              class="text-action"
              type="button"
              @click=${() => void this.#load('environment')}
            >
              ${msg.camera}
            </button>
            <button class="text-action" type="button" @click=${() => void this.#load()}>
              ${reference ? msg.replace : msg.file}
            </button>
          </div>
        </div>
        <div class="sheet-block">
          <p class="field-label" aria-hidden="true">
            <span>${msg.opacity}</span><span class="value">${Math.round(opacity * 100)} %</span>
          </p>
          <fl-slider
            label=${msg.opacity}
            unit="%"
            .value=${Math.round(opacity * 100)}
            ?disabled=${!reference}
            @input=${(event: CustomEvent<number>) => this.editor.setOpacity(event.detail / 100, false)}
            @change=${(event: CustomEvent<number>) => this.editor.setOpacity(event.detail / 100, true)}
          ></fl-slider>
          ${this.#renderFormatTabs(format)}
          ${reference ? this.#renderChecks(reference) : html`<p class="hint">${msg.emptyHint}</p>`}
          <button
            class="tap primary apply"
            type="button"
            ?disabled=${!reference}
            @click=${() => emit(this, 'apply')}
          >
            <span>${msg.apply}</span><span aria-hidden="true">→</span>
          </button>
        </div>
      </fl-sheet>
    `;
  }

  #renderMobile(reference: Reference | undefined): TemplateResult {
    return html`
      <div class="mobile">
        <div class="table-surface stage">
          ${reference ? this.#renderPhoto(reference) : this.#renderEmpty()}
          ${
            reference && this.dragging
              ? html`<div class="mini loupe-box">${this.#renderLoupe(reference)}</div>`
              : nothing
          }
        </div>
        ${this.#renderMobileSheet(reference)}
      </div>
    `;
  }

  protected override render(): TemplateResult {
    const reference = this.#reference;
    if (this.mobile) return this.#renderMobile(reference);
    return html`
      <div class="layout">
        <div class="table-surface stage">
          ${reference ? this.#renderPhoto(reference) : this.#renderEmpty()}
          ${reference ? html`<div class="mini loupe-box">${this.#renderLoupe(reference)}</div>` : nothing}
        </div>
        ${this.#renderContext(reference)}
      </div>
    `;
  }
}
