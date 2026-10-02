import { html, svg, nothing, type SVGTemplateResult, type TemplateResult } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { SHEET_A4, type LineInput, type Sheet, type Vec2 } from '@faltstudio/core';
import { BaseElement, boolProp, emit } from '@faltstudio/ui';
import type { CanvasPointer, PointerPhase } from '../../tools/canvas-pointer.js';
import { editorText } from '../../i18n/editor.js';
import { creaseCanvasStyles } from './crease-canvas.styles.js';
import { createProjection, type Point, type Projection } from './projection.js';

/** Beruehrung: der Zielpunkt liegt so weit ueber dem Finger (Design C11). */
export const TOUCH_OFFSET_PX = 60;
const MAX_ZOOM = 6;
/** Raster auf dem Papier: feine Linie alle 10 mm, kraeftige alle 50 mm. */
const GRID_STEP_MM = 10;
const GRID_MAJOR_MM = 50;

interface ViewBox {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** Fingerposition in SVG-Koordinaten und SVG-Einheiten pro Bildschirmpixel. */
interface Finger {
  readonly x: number;
  readonly y: number;
  readonly unit: number;
}

interface Pinch {
  readonly box: ViewBox;
  readonly inverse: DOMMatrix;
  readonly distance: number;
  readonly mid: DOMPoint;
}

/**
 * 2D-Ansicht des Faltmusters. Zeichnet nur, haelt keinen Geometrie-Zustand:
 * Linien, Auswahl und Vorschlaege kommen von aussen. Mit `mini` entsteht das
 * Diagramm fuer Schrittkarten. Mit `interactive` meldet sie Zeigerereignisse
 * in Modellkoordinaten; was daraus wird, entscheiden die Werkzeuge.
 *
 * @fires canvaspointer - detail: CanvasPointer.
 * @fires zoomchange - detail: true, sobald ein Ausschnitt gezoomt ist.
 */
export class CreaseCanvas extends BaseElement {
  static override styles = [BaseElement.styles, creaseCanvasStyles];

  @property({ attribute: false }) sheet: Sheet = SHEET_A4;
  @property({ attribute: false }) lines: readonly LineInput[] = [];
  @property({ attribute: false }) snaps: readonly Point[] = [];
  @property({ attribute: false }) selected: readonly string[] = [];
  @property({ attribute: false }) highlighted: readonly string[] = [];
  @property({ attribute: false }) suggested: readonly string[] = [];
  /** Schraffierte Flaechen, z.B. die bewegliche Seite eines Schritts. */
  @property({ attribute: false }) faces: readonly (readonly Point[])[] = [];

  /** Entzerrte Foto-Vorlage unter dem Muster (M6). */
  @property({ attribute: false }) underlay?: { readonly href: string; readonly opacity: number };
  /** Vorschau der Linie, die gerade gezeichnet wird. */
  @property({ attribute: false }) draft?: { readonly a: Vec2; readonly b: Vec2 };
  /** Eingerasteter Zeigerpunkt mit Tooltip-Zeilen (C07). */
  @property({ attribute: false }) cursor?: {
    readonly point: Vec2;
    readonly lines: readonly string[];
    readonly snapped: boolean;
  };

  /** Linien, die auch ohne `line-labels` beschriftet werden (Auswahl, Hover, Vorschlag). */
  @property({ attribute: false }) labelled: readonly string[] = [];

  /** Vorgelesener Name; ohne Wert „Faltmuster“ in der aktuellen Sprache. */
  @property() label = '';
  @boolProp() interactive = false;
  @query('svg') private surface?: SVGSVGElement | null;
  @property({ attribute: 'selected-label' }) selectedLabel = '';
  @boolProp() mini = false;
  @boolProp() dimensions = false;
  @boolProp({ attribute: 'line-labels' }) lineLabels = false;
  @boolProp() symmetry = false;
  @boolProp({ attribute: 'dim-others' }) dimOthers = false;
  @boolProp({ attribute: 'hide-flat' }) hideFlat = false;
  /** Zwei Finger zoomen und verschieben (mobil). */
  @boolProp() zoomable = false;

  /** Sichtbarer Ausschnitt; ohne Wert das ganze Blatt. */
  @state() private box: ViewBox | undefined;
  /** Fingerposition in SVG-Koordinaten, solange ein Finger zeichnet. */
  @state() private finger: Finger | undefined;
  /** Beruehrung zielt mit der Lupe ueber dem Finger (Zeichnen, Messen). */
  @boolProp() aim = false;

  readonly #touches = new Map<number, DOMPoint>();
  #pinch: Pinch | undefined;

  /** Zeigt wieder das ganze Blatt. */
  resetZoom(): void {
    this.#setBox(undefined);
  }

  #setBox(box: ViewBox | undefined): void {
    const changed = (box === undefined) !== (this.box === undefined);
    this.box = box;
    if (changed) emit<boolean>(this, 'zoomchange', box !== undefined);
  }

  get zoomed(): boolean {
    return this.box !== undefined;
  }

  get #projection(): Projection {
    return createProjection(this.sheet, this.mini ? { scale: 0.5, pad: 5 } : { scale: 2, pad: 44 });
  }

  #lineClass(line: LineInput): string {
    if (this.selected.includes(line.id)) return 'crease selected';
    if (this.mini)
      return this.highlighted.includes(line.id) ? `crease on ${line.kind}` : 'crease off';
    const dimmed = this.dimOthers && !this.highlighted.includes(line.id);
    return `crease ${line.kind}${dimmed ? ' dimmed' : ''}`;
  }

  #renderLine(line: LineInput, view: Projection): SVGTemplateResult {
    const a = view.point(line.a);
    const b = view.point(line.b);
    return svg`<line class=${this.#lineClass(line)} x1=${a.x} y1=${a.y} x2=${b.x} y2=${b.y}></line>`;
  }

  #renderLineLabel(line: LineInput, view: Projection): SVGTemplateResult | typeof nothing {
    const wanted = this.lineLabels || this.labelled.includes(line.id);
    if (!wanted || this.selected.includes(line.id)) return nothing;
    const mid = view.point([(line.a[0] + line.b[0]) / 2, (line.a[1] + line.b[1]) / 2]);
    return svg`<text class="line-label" x=${mid.x + 5} y=${mid.y - 5}>${line.id}</text>`;
  }

  #visibleLines(): readonly LineInput[] {
    if (!this.hideFlat) return this.lines;
    return this.lines.filter((line) => line.kind !== 'flat');
  }

  #renderUnderlay(view: Projection): SVGTemplateResult | typeof nothing {
    if (!this.underlay) return nothing;
    const corner = view.point([0, this.sheet.height]);
    return svg`<image class="underlay" href=${this.underlay.href} x=${corner.x} y=${corner.y}
      width=${this.sheet.width * view.scale} height=${this.sheet.height * view.scale}
      preserveAspectRatio="none" opacity=${this.underlay.opacity}></image>`;
  }

  #renderFaces(view: Projection): SVGTemplateResult[] {
    return this.faces.map((face) => {
      const list = face
        .map((corner) => view.point(corner))
        .map((point) => `${point.x},${point.y}`)
        .join(' ');
      return svg`<polygon class="face" points=${list}></polygon>`;
    });
  }

  /** Schatten unter dem Blatt: das Papier liegt auf dem Tisch. */
  #renderShadow(view: Projection): SVGTemplateResult | typeof nothing {
    if (this.mini) return nothing;
    const corner = view.point([0, this.sheet.height]);
    return svg`<rect class="shadow" x=${corner.x + 8} y=${corner.y + 22}
      width=${this.sheet.width * view.scale} height=${this.sheet.height * view.scale}
      filter="url(#paper-shadow)"></rect>`;
  }

  /** Das Raster liegt nur auf dem Papier, nicht auf dem Tisch. */
  #renderPaperGrid(view: Projection): SVGTemplateResult | typeof nothing {
    if (this.mini) return nothing;
    const { width, height } = this.sheet;
    const columns = Array.from(
      { length: Math.ceil(width / GRID_STEP_MM) - 1 },
      (_, index) => (index + 1) * GRID_STEP_MM,
    );
    const rows = Array.from(
      { length: Math.ceil(height / GRID_STEP_MM) - 1 },
      (_, index) => (index + 1) * GRID_STEP_MM,
    );
    const gridClass = (value: number): string =>
      value % GRID_MAJOR_MM === 0 ? 'paper-grid major' : 'paper-grid';
    return svg`${columns.map((x) => {
      const top = view.point([x, height]);
      const bottom = view.point([x, 0]);
      return svg`<line class=${gridClass(x)} x1=${top.x} y1=${top.y} x2=${bottom.x} y2=${bottom.y}></line>`;
    })}${rows.map((y) => {
      const left = view.point([0, y]);
      const right = view.point([width, y]);
      return svg`<line class=${gridClass(y)} x1=${left.x} y1=${left.y} x2=${right.x} y2=${right.y}></line>`;
    })}`;
  }

  #renderSheet(view: Projection, className: string): SVGTemplateResult {
    const corner = view.point([0, this.sheet.height]);
    return svg`<rect class=${className} x=${corner.x} y=${corner.y}
      width=${this.sheet.width * view.scale} height=${this.sheet.height * view.scale}></rect>`;
  }

  #renderSymmetry(view: Projection): SVGTemplateResult | typeof nothing {
    if (!this.symmetry) return nothing;
    const top = view.point([this.sheet.width / 2, this.sheet.height]);
    const bottom = view.point([this.sheet.width / 2, 0]);
    return svg`
      <line class="axis" x1=${top.x} y1=${top.y - 8} x2=${bottom.x} y2=${view.height - 4}></line>
      <text class="line-label" x=${top.x + 6} y=${view.height - 6}>${editorText().canvas.symmetryAxis}</text>
    `;
  }

  #renderSnap(point: Point, view: Projection): SVGTemplateResult {
    const { x, y } = view.point(point);
    return svg`
      <circle class="snap" cx=${x} cy=${y} r="4.5"></circle>
      <path class="snap-cross" d="M${x - 10} ${y}H${x - 6}M${x + 6} ${y}H${x + 10}M${x} ${y - 10}V${y - 6}M${x} ${y + 6}V${y + 10}"></path>
    `;
  }

  #renderSelection(view: Projection): SVGTemplateResult[] {
    return this.lines
      .filter((line) => this.selected.includes(line.id))
      .map((line) => this.#renderSelectedLine(line, view));
  }

  #renderSelectedLine(line: LineInput, view: Projection): SVGTemplateResult {
    const a = view.point(line.a);
    const b = view.point(line.b);
    const handles = [a, b].map(
      (end) =>
        svg`<rect class="handle" x=${end.x - 4.5} y=${end.y - 4.5} width="9" height="9"></rect>`,
    );
    const tag = this.selectedLabel
      ? this.#renderTag((a.x + b.x) / 2 + 14, (a.y + b.y) / 2, this.selectedLabel, false)
      : nothing;
    return svg`${handles}${tag}`;
  }

  #renderSuggestions(view: Projection): SVGTemplateResult[] {
    return this.lines
      .filter((line) => this.suggested.includes(line.id))
      .map((line) => {
        const a = view.point(line.a);
        const b = view.point(line.b);
        const tag = this.#renderTag(
          (a.x + b.x) / 2 + 14,
          (a.y + b.y) / 2 + 22,
          editorText().canvas.collinear(line.id),
          true,
        );
        return svg`<line class="suggest" x1=${a.x} y1=${a.y} x2=${b.x} y2=${b.y}></line>${tag}`;
      });
  }

  #renderTag(x: number, y: number, text: string, outline: boolean): SVGTemplateResult {
    const width = text.length * 7.2 + 14;
    return svg`
      <rect class=${outline ? 'tag outline' : 'tag'} x=${x} y=${y - 16} width=${width} height="20"></rect>
      <text class=${outline ? 'tag-text outline' : 'tag-text'} x=${x + 7} y=${y - 2}>${text.toUpperCase()}</text>
    `;
  }

  #renderDimensions(view: Projection): SVGTemplateResult | typeof nothing {
    if (!this.dimensions) return nothing;
    const topLeft = view.point([0, this.sheet.height]);
    const bottomRight = view.point([this.sheet.width, 0]);
    const top = topLeft.y - 24;
    const left = topLeft.x - 24;
    const midX = (topLeft.x + bottomRight.x) / 2;
    const midY = (topLeft.y + bottomRight.y) / 2;
    return svg`
      <path class="dimension" d="M${topLeft.x} ${topLeft.y - 4}V${top - 6}M${bottomRight.x} ${topLeft.y - 4}V${top - 6}M${topLeft.x} ${top}H${bottomRight.x}M${topLeft.x - 4} ${top + 4}l8 -8M${bottomRight.x - 4} ${top + 4}l8 -8"></path>
      <path class="dimension" d="M${topLeft.x - 4} ${topLeft.y}H${left - 6}M${topLeft.x - 4} ${bottomRight.y}H${left - 6}M${left} ${topLeft.y}V${bottomRight.y}M${left - 4} ${topLeft.y + 4}l8 -8M${left - 4} ${bottomRight.y + 4}l8 -8"></path>
      <rect class="dimension-gap" x=${midX - 30} y=${top - 8} width="60" height="16"></rect>
      <text class="dimension-text" x=${midX} y=${top + 4}>${this.sheet.width.toFixed(1)}</text>
      <rect class="dimension-gap" x=${left - 8} y=${midY - 30} width="16" height="60"></rect>
      <text class="dimension-text" x=${left + 4} y=${midY} transform="rotate(-90 ${left + 4} ${midY})">${this.sheet.height.toFixed(1)}</text>
    `;
  }

  #toModel(
    event: PointerEvent,
    lift = 0,
  ): { readonly point: Vec2; readonly mmPerPixel: number; readonly local: Finger } | undefined {
    const matrix = this.surface?.getScreenCTM();
    if (!this.surface || !matrix) return undefined;
    const inverse = matrix.inverse();
    const local = new DOMPoint(event.clientX, event.clientY - lift).matrixTransform(inverse);
    const view = this.#projection;
    const pad = (view.width - this.sheet.width * view.scale) / 2;
    const point: Vec2 = [
      (local.x - pad) / view.scale,
      this.sheet.height - (local.y - pad) / view.scale,
    ];
    const finger = new DOMPoint(event.clientX, event.clientY).matrixTransform(inverse);
    return {
      point,
      mmPerPixel: 1 / (view.scale * matrix.a),
      local: { x: finger.x, y: finger.y, unit: 1 / matrix.a },
    };
  }

  #emit(event: PointerEvent, phase: PointerPhase, lift = 0, touch = false): void {
    const hit = this.#toModel(event, lift);
    if (!hit) return;
    emit<CanvasPointer>(this, 'canvaspointer', {
      phase,
      point: hit.point,
      shift: event.shiftKey,
      alt: event.altKey,
      mmPerPixel: hit.mmPerPixel,
      touch,
    });
    this.finger = touch && lift > 0 && phase === 'move' ? hit.local : undefined;
  }

  #onPointer(event: PointerEvent, phase: PointerPhase): void {
    if (!this.interactive) return;
    if (phase === 'down') event.preventDefault();
    this.#emit(event, phase);
  }

  /**
   * Beruehrung: Zielen mit versetzter Lupe, gesetzt wird beim Loslassen. Ein
   * zweiter Finger bricht die Geste ab und zoomt stattdessen.
   */
  #onTouch(event: PointerEvent, phase: 'down' | 'move' | 'up' | 'cancel'): void {
    const point = new DOMPoint(event.clientX, event.clientY);
    if (phase === 'down') {
      event.preventDefault();
      this.surface?.setPointerCapture?.(event.pointerId);
      this.#touches.set(event.pointerId, point);
      if (this.#touches.size === 2 && this.zoomable) {
        this.#startPinch();
        this.#emit(event, 'leave');
        return;
      }
    }
    if (!this.#touches.has(event.pointerId)) return;
    if (phase === 'move') this.#touches.set(event.pointerId, point);
    if (this.#pinch) {
      if (phase === 'move') this.#movePinch();
      else if (phase === 'up' || phase === 'cancel') this.#endTouch(event.pointerId);
      return;
    }
    if (!this.interactive) return this.#endTouch(event.pointerId, phase);
    const lift = this.aim ? TOUCH_OFFSET_PX : 0;
    if (phase === 'up') {
      this.#emit(event, 'down', lift, true);
      this.#emit(event, 'leave', lift, true);
    } else if (phase === 'cancel') this.#emit(event, 'leave', 0, true);
    else if (this.aim) this.#emit(event, 'move', lift, true);
    this.#endTouch(event.pointerId, phase);
  }

  #endTouch(id: number, phase?: string): void {
    if (phase === 'down' || phase === 'move') return;
    this.#touches.delete(id);
    if (this.#touches.size === 0) {
      this.#pinch = undefined;
      this.finger = undefined;
    }
  }

  #fullBox(): ViewBox {
    const view = this.#projection;
    return { x: 0, y: 0, width: view.width, height: view.height };
  }

  #startPinch(): void {
    const matrix = this.surface?.getScreenCTM();
    if (!matrix) return;
    const [a, b] = [...this.#touches.values()];
    if (!a || !b) return;
    this.#pinch = {
      box: this.box ?? this.#fullBox(),
      inverse: matrix.inverse(),
      distance: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)),
      mid: new DOMPoint((a.x + b.x) / 2, (a.y + b.y) / 2),
    };
  }

  #movePinch(): void {
    const pinch = this.#pinch;
    const [a, b] = [...this.#touches.values()];
    if (!pinch || !a || !b) return;
    const full = this.#fullBox();
    const start = pinch.box;
    const distance = Math.max(1, Math.hypot(a.x - b.x, a.y - b.y));
    const zoom = Math.min(
      MAX_ZOOM,
      Math.max(1, (full.width / start.width) * (distance / pinch.distance)),
    );
    if (zoom <= 1.02) return this.#setBox(undefined);
    const factor = start.width / (full.width / zoom);
    const anchor = pinch.mid.matrixTransform(pinch.inverse);
    const now = new DOMPoint((a.x + b.x) / 2, (a.y + b.y) / 2).matrixTransform(pinch.inverse);
    const width = full.width / zoom;
    const height = full.height / zoom;
    const x = anchor.x - (now.x - start.x) / factor;
    const y = anchor.y - (now.y - start.y) / factor;
    this.#setBox({
      x: Math.min(full.width - width / 2, Math.max(-width / 2, x)),
      y: Math.min(full.height - height / 2, Math.max(-height / 2, y)),
      width,
      height,
    });
  }

  #pointer(phase: 'down' | 'move' | 'up' | 'cancel' | 'leave') {
    return (event: PointerEvent): void => {
      const touch = event.pointerType === 'touch';
      if (touch && phase !== 'leave') return this.#onTouch(event, phase);
      if (touch) return;
      if (phase === 'down' || phase === 'move' || phase === 'leave') this.#onPointer(event, phase);
    };
  }

  #renderDraft(view: Projection): SVGTemplateResult | typeof nothing {
    if (!this.draft) return nothing;
    const a = view.point(this.draft.a);
    const b = view.point(this.draft.b);
    return svg`<line class="draft" x1=${a.x} y1=${a.y} x2=${b.x} y2=${b.y}></line>`;
  }

  #renderCursor(view: Projection): SVGTemplateResult | typeof nothing {
    if (!this.cursor) return nothing;
    if (this.finger) return this.#renderLoupe(view, this.finger);
    const { x, y } = view.point(this.cursor.point);
    const height = 12 + this.cursor.lines.length * 16;
    const boxX = Math.min(x + 24, view.width - 200);
    const boxY = Math.min(y + 18, view.height - height);
    return svg`
      <path class="guide" d="M0 ${y}H${view.width}M${x} 0V${view.height}"></path>
      <circle class=${this.cursor.snapped ? 'cursor snapped' : 'cursor'} cx=${x} cy=${y} r="8"></circle>
      <path class="cursor-cross" d="M${x - 20} ${y}H${x - 11}M${x + 11} ${y}H${x + 20}M${x} ${y - 20}V${y - 11}M${x} ${y + 11}V${y + 20}"></path>
      <rect class="tip" x=${boxX} y=${boxY} width="196" height=${height}></rect>
      ${this.cursor.lines.map((line, index) => svg`<text class=${index === 0 ? 'tip-text primary' : 'tip-text'} x=${boxX + 10} y=${boxY + 18 + index * 16}>${line}</text>`)}
    `;
  }

  /** Lupe ueber dem Finger: Fadenkreuz, Einrastzustand, Koordinaten (C11). */
  #renderLoupe(view: Projection, finger: Finger): SVGTemplateResult | typeof nothing {
    if (!this.cursor) return nothing;
    const { x, y } = view.point(this.cursor.point);
    const unit = finger.unit;
    const radius = 48 * unit;
    const size = (value: number): number => value * unit;
    const tag = this.cursor.snapped ? editorText().canvas.snapped : editorText().canvas.free;
    const lines = this.cursor.lines.slice(0, 2);
    const boxWidth = size(196);
    const boxX =
      x - radius - size(12) - boxWidth > 0
        ? x - radius - size(12) - boxWidth
        : x + radius + size(12);
    return svg`
      <g class="loupe">
        <line class="loupe-stem" x1=${finger.x} y1=${finger.y - size(26)} x2=${x} y2=${y + radius}></line>
        <circle class="loupe-finger" cx=${finger.x} cy=${finger.y} r=${size(22)}></circle>
        <circle class="loupe-ring" cx=${x} cy=${y} r=${radius}></circle>
        <circle class=${this.cursor.snapped ? 'cursor snapped' : 'cursor'} cx=${x} cy=${y} r=${size(12)}></circle>
        <path class="cursor-cross" d="M${x - radius + size(6)} ${y}H${x - size(14)}M${x + size(14)} ${y}H${x + radius - size(6)}M${x} ${y - radius + size(6)}V${y - size(14)}M${x} ${y + size(14)}V${y + radius - size(6)}"></path>
        <g transform="translate(${x - radius} ${y - radius - size(14)}) scale(${unit})">${this.#renderTag(0, 0, tag, !this.cursor.snapped)}</g>
        <g transform="translate(${boxX} ${y - radius + size(8)}) scale(${unit})">
          <rect class="tip" x="0" y="0" width="196" height=${12 + lines.length * 16}></rect>
          ${lines.map((line, index) => svg`<text class=${index === 0 ? 'tip-text primary' : 'tip-text'} x="10" y=${18 + index * 16}>${line}</text>`)}
        </g>
      </g>
    `;
  }

  protected override render(): TemplateResult {
    const view = this.#projection;
    const box = this.box ?? this.#fullBox();
    const lines = this.#visibleLines();
    return html`
      <svg
        class=${this.mini ? 'canvas mini' : `canvas${this.interactive ? ' interactive' : ''}${this.box ? ' zoomed' : ''}`}
        viewBox="${box.x} ${box.y} ${box.width} ${box.height}"
        role="img"
        aria-label=${this.label || editorText().canvas.pattern}
        @pointermove=${this.#pointer('move')}
        @pointerdown=${this.#pointer('down')}
        @pointerup=${this.#pointer('up')}
        @pointercancel=${this.#pointer('cancel')}
        @pointerleave=${this.#pointer('leave')}
      >
        <defs>
          <pattern
            id="hatch"
            width="6"
            height="6"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line class="hatch" x1="0" y1="0" x2="0" y2="6"></line>
          </pattern>
          <filter id="paper-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="14"></feGaussianBlur>
          </filter>
        </defs>
        ${this.#renderShadow(view)} ${this.#renderSheet(view, 'sheet')}
        ${this.#renderPaperGrid(view)} ${this.#renderUnderlay(view)} ${this.#renderFaces(view)}
        ${this.#renderSymmetry(view)} ${lines.map((line) => this.#renderLine(line, view))}
        ${lines.map((line) => this.#renderLineLabel(line, view))}
        ${this.#renderSheet(view, 'border')} ${this.#renderSuggestions(view)}
        ${this.snaps.map((point) => this.#renderSnap(point, view))} ${this.#renderSelection(view)}
        ${this.#renderDimensions(view)} ${this.#renderDraft(view)} ${this.#renderCursor(view)}
      </svg>
    `;
  }
}
