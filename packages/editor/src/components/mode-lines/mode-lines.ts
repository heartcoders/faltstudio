import { html, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import type { LineInput } from '@faltstudio/core';
import { BaseElement, boolProp, type Scene } from '@faltstudio/ui';
import type { Editor } from '../../state/editor.js';
import type { SnapSettings, Tool } from '../../state/editor-state.js';
import { patternLines } from '../../state/pattern-view.js';
import { SheetController } from '../../state/sheet-controller.js';
import { StoreController } from '../../state/store-controller.js';
import type { CanvasPointer } from '../../tools/canvas-pointer.js';
import type { CreaseCanvas } from '../crease-canvas/crease-canvas.js';
import { wholeLine } from '../../tools/hit-test.js';
import { ToolController } from '../../tools/tool-controller.js';
import { workspaceStyles } from '../../styles/workspace.js';
import { kindLabel, kindSample, nextKind } from '../mobile/mobile-kind.js';
import { common } from '../../i18n/common.js';
import { editorText } from '../../i18n/editor.js';
import { kindHelpStyles, renderKindHelp } from '../kind-help.js';
import { mobileStyles } from '../mobile/mobile.styles.js';
import { readoutLines } from './readout.js';
import { modeLinesStyles } from './mode-lines.styles.js';

/** Modus 02 Linien: grosse Zeichenflaeche, 3D klein in der Ecke, Werkzeuge rechts. */
export class ModeLines extends BaseElement {
  static override styles = [
    BaseElement.styles,
    workspaceStyles,
    mobileStyles,
    modeLinesStyles,
    kindHelpStyles,
  ];

  @property({ attribute: false }) editor!: Editor;
  /** Mobile Anordnung (Design v2 M3/M4): Werkzeugleiste und Sheet unten. */
  @boolProp() mobile = false;
  @state() private large = false;
  @state() private zoomed = false;
  @query('fl-crease-canvas') private canvas?: CreaseCanvas | null;
  @query('fl-scene') private scene?: Scene | null;

  #tools: ToolController | undefined;
  #observed = false;

  override connectedCallback(): void {
    super.connectedCallback();
    if (this.#observed) return;
    this.#observed = true;
    new StoreController(this, this.editor.document, this.editor.ui, this.editor.cursor);
    new SheetController(this, {
      scene: () => this.scene,
      pattern: () => this.editor.pattern,
      state: () => undefined,
    });
    this.#tools = new ToolController(this.editor);
  }

  /** Bricht die laufende Geste ab (Escape). */
  cancelGesture(): void {
    this.#tools?.cancel();
  }

  protected override updated(changed: PropertyValues): void {
    if (changed.has('large')) this.scene?.fitContent?.();
  }

  get #lines(): readonly LineInput[] {
    return patternLines(this.editor.pattern);
  }

  get #underlay(): { readonly href: string; readonly opacity: number } | undefined {
    const href = this.editor.rectifiedPhoto;
    const opacity = this.editor.document.get().reference?.opacity ?? 0;
    return href ? { href, opacity } : undefined;
  }

  #renderCanvas(): TemplateResult {
    const { selection, symmetry, tool } = this.editor.ui.get();
    const cursor = this.editor.cursor.get();
    return html`
      <fl-crease-canvas
        interactive
        .sheet=${this.editor.document.get().sheet}
        .lines=${this.#lines}
        .selected=${selection}
        .labelled=${cursor.snapCrease ? [cursor.snapCrease] : []}
        .underlay=${this.#underlay}
        .draft=${cursor.start && cursor.point ? { a: cursor.start, b: cursor.point } : undefined}
        .cursor=${cursor.point ? { point: cursor.point, lines: readoutLines(cursor), snapped: (cursor.snap ?? 'free') !== 'free' } : undefined}
        ?dimensions=${!this.mobile}
        ?zoomable=${this.mobile}
        ?aim=${tool !== 'select'}
        ?symmetry=${symmetry}
        @canvaspointer=${(event: CustomEvent<CanvasPointer>) => this.#tools?.handle(event.detail)}
        @zoomchange=${(event: CustomEvent<boolean>) => (this.zoomed = event.detail)}
      ></fl-crease-canvas>
    `;
  }

  #renderHint(): TemplateResult | typeof nothing {
    const { tool } = this.editor.ui.get();
    if (tool === 'select') return nothing;
    const started = this.editor.cursor.get().start !== undefined;
    const msg = editorText();
    return html`<p class="hint-box">
      <b>${msg.tools.labels[tool]} · ${msg.lines.tap(started ? 2 : 1)}</b>
      ${started ? msg.lines.tapEnd : msg.lines.tapStart}
    </p>`;
  }

  #renderTile(): TemplateResult {
    return html`<div class=${this.large ? 'tile large' : 'tile'}>
      <fl-scene></fl-scene>
      <button
        class="tap tile-toggle"
        type="button"
        aria-label=${this.large ? editorText().lines.backToSheet : editorText().lines.open3d}
        @click=${() => (this.large = !this.large)}
      >
        ${this.large ? '↙ 2D' : '3D'}
      </button>
    </div>`;
  }

  #renderSnapSheet(): TemplateResult {
    const ui = this.editor.ui.get();
    const msg = editorText();
    const snaps: readonly (keyof SnapSettings)[] = [
      'vertices',
      'midpoints',
      'intersections',
      'grid',
    ];
    const active = snaps
      .filter((snap) => ui.snaps[snap])
      .map((snap) => msg.lines.snapTargets[snap].slice(0, 7));
    const summary =
      [...active, ...(ui.symmetry ? [msg.tools.symmetryShort] : [])].join(' · ') || msg.tools.off;
    const kinds = common().kinds;
    return html`
      <fl-sheet label=${msg.tools.snapping}>
        <div slot="head" class="sheet-row">
          <p class="sheet-title">${msg.tools.snapping}</p>
          <span class="sheet-summary">${summary}</span>
        </div>
        <ul class="rows">
          ${snaps.map(
            (snap) =>
              html`<li>
                <fl-checkbox
                  ?checked=${ui.snaps[snap]}
                  @change=${(event: CustomEvent<boolean>) =>
                    this.editor.updateUi({ snaps: { ...ui.snaps, [snap]: event.detail } })}
                  >${msg.lines.snapTargets[snap]}</fl-checkbox
                ><span class="note">${msg.lines.snapNotes[snap]}</span>
              </li>`,
          )}
          <li>
            <fl-checkbox
              ?checked=${ui.symmetry}
              @change=${(event: CustomEvent<boolean>) => this.editor.updateUi({ symmetry: event.detail })}
              >${msg.tools.symmetry}</fl-checkbox
            ><span class="note">${msg.lines.axisY}</span>
          </li>
        </ul>
        <ul class="legend" aria-label=${msg.lines.legend}>
          <li>${kindSample('valley')} ${kinds.valley}</li>
          <li>${kindSample('mountain')} ${kinds.mountain}</li>
          <li>${kindSample('flat')} ${kinds.flat}</li>
          <li>◯ ${msg.lines.snapPoint}</li>
        </ul>
        ${renderKindHelp()}
      </fl-sheet>
    `;
  }

  /** Auswahl: Kopfzeile im Sheet mit Laenge und Winkel des ersten Stuecks. */
  #renderSelectionSheet(): TemplateResult {
    const { selection } = this.editor.ui.get();
    const lines = this.#lines.filter((line) => selection.includes(line.id));
    const first = lines[0];
    const length = lines.reduce(
      (sum, line) => sum + Math.hypot(line.b[0] - line.a[0], line.b[1] - line.a[1]),
      0,
    );
    const angle = first
      ? (Math.atan2(first.b[1] - first.a[1], first.b[0] - first.a[0]) * 180) / Math.PI
      : 0;
    const kind = first ? kindLabel(first.kind) : '';
    const msg = editorText();
    return html`
      <fl-sheet label=${msg.lines.selection}>
        <div slot="head" class="sheet-row">
          <p class="sheet-title">
            ${selection.length === 1 ? selection[0] : msg.lines.pieces(selection.length)}
          </p>
          <span class="sheet-summary"
            >${kind} · ${length.toFixed(1)} mm · ∠ ${Math.abs(angle).toFixed(1)}°</span
          >
        </div>
        <ul class="rows">
          ${lines.map((line) => html`<li><span>${line.id}</span><span class="note">${kindLabel(line.kind)}</span></li>`)}
        </ul>
      </fl-sheet>
    `;
  }

  #renderContextBar(): TemplateResult {
    const { selection, kind } = this.editor.ui.get();
    const pattern = this.editor.pattern;
    const whole = [...new Set(selection.flatMap((id) => wholeLine(pattern, id)))];
    const msg = editorText();
    return html`<div class="context-bar" role="toolbar" aria-label=${msg.lines.selection}>
      <button class="tap" type="button" @click=${() => this.editor.setKind(nextKind(kind))}>
        ${kindSample(kind, 28)} ${kindLabel(kind)} ⟳
      </button>
      <button
        class="tap dashed"
        type="button"
        ?disabled=${whole.length === selection.length}
        @click=${() => this.editor.select(whole)}
      >
        ${msg.lines.wholeLine}
      </button>
      <button class="tap critical" type="button" @click=${() => this.editor.deleteSelection()}>
        ${msg.lines.delete}
      </button>
    </div>`;
  }

  #renderToolbar(): TemplateResult {
    const ui = this.editor.ui.get();
    const msg = editorText().tools;
    const tools: readonly { readonly value: Tool; readonly glyph: string }[] = [
      { value: 'select', glyph: '↖' },
      { value: 'line', glyph: '╱' },
      { value: 'measure', glyph: '↔' },
    ];
    return html`<nav class="toolbar" aria-label=${msg.nav}>
      ${tools.map(
        (tool) =>
          html`<button
            class="tap"
            type="button"
            aria-pressed=${ui.tool === tool.value ? 'true' : 'false'}
            @click=${() => {
              this.#tools?.cancel();
              this.editor.updateUi({ tool: tool.value });
            }}
          >
            <span class="glyph" aria-hidden="true">${tool.glyph}</span>${msg.labels[tool.value]}
          </button>`,
      )}
      <button
        class="tap setting"
        type="button"
        aria-label=${editorText().lines.kindToggle(kindLabel(ui.kind))}
        @click=${() => this.editor.setKind(nextKind(ui.kind))}
      >
        ${kindSample(ui.kind, 40)}${kindLabel(ui.kind)} ⟳
      </button>
      <button
        class="tap setting"
        type="button"
        role="switch"
        aria-checked=${ui.symmetry ? 'true' : 'false'}
        aria-label=${msg.symmetry}
        @click=${() => this.editor.updateUi({ symmetry: !ui.symmetry })}
      >
        <span class=${ui.symmetry ? 'badge' : 'badge off'} aria-hidden="true"
          >${ui.symmetry ? msg.on : msg.off}</span
        >${msg.symmetryShort}
      </button>
    </nav>`;
  }

  #renderMobile(): TemplateResult {
    const { selection, tool } = this.editor.ui.get();
    const selecting = tool === 'select' && selection.length > 0;
    return html`
      <div class="mobile">
        <div class="table-surface stage">
          ${this.#renderCanvas()} ${this.#renderHint()} ${this.#renderTile()}
          <div class="history">
            <button
              class="tap"
              type="button"
              aria-label=${editorText().lines.undo}
              ?disabled=${!this.editor.document.canUndo}
              @click=${() => this.editor.undo()}
            >
              ↶
            </button>
            <button
              class="tap"
              type="button"
              aria-label=${editorText().lines.redo}
              ?disabled=${!this.editor.document.canRedo}
              @click=${() => this.editor.redo()}
            >
              ↷
            </button>
          </div>
          ${
            this.zoomed
              ? html`<button
                  class="tap zoom-reset"
                  type="button"
                  @click=${() => this.canvas?.resetZoom()}
                >
                  ${editorText().lines.wholeSheet}
                </button>`
              : nothing
          }
        </div>
        ${selecting ? this.#renderSelectionSheet() : this.#renderSnapSheet()}
        ${selecting ? this.#renderContextBar() : nothing} ${this.#renderToolbar()}
      </div>
    `;
  }

  protected override render(): TemplateResult {
    if (this.mobile) return this.#renderMobile();
    return html`
      <div class="layout table-surface">
        <fl-tool-rail .editor=${this.editor}></fl-tool-rail>
        <div class="desk-sheet">${this.#renderCanvas()}</div>
        <div class="desk-scene">
          <fl-scene></fl-scene>
          <p class="scene-label">${editorText().lines.sceneLabel}</p>
          <fl-issues-card class="desk-issues" .editor=${this.editor}></fl-issues-card>
        </div>
      </div>
    `;
  }
}
