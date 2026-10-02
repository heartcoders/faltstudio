import { html, svg, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { BaseElement } from '@faltstudio/ui';
import type { Editor } from '../../state/editor.js';
import type { DrawKind, SnapSettings, Tool } from '../../state/editor-state.js';
import { StoreController } from '../../state/store-controller.js';
import { common } from '../../i18n/common.js';
import { editorText } from '../../i18n/editor.js';
import { kindHelpStyles, renderKindHelp } from '../kind-help.js';
import { toolRailStyles } from './tool-rail.styles.js';

const TOOLS: readonly { readonly value: Tool; readonly key: string }[] = [
  { value: 'select', key: 'V' },
  { value: 'line', key: 'L' },
  { value: 'measure', key: 'M' },
];

const KINDS: readonly DrawKind[] = ['valley', 'mountain', 'flat'];

const SNAP_TARGETS: readonly (keyof SnapSettings)[] = [
  'vertices',
  'midpoints',
  'intersections',
  'grid',
];

/**
 * Werkzeugliste links im Linien-Modus (Redesign D2): schlichte Textzeilen in
 * drei Gruppen, die aktive Zeile invertiert. Eine neue Faltart gilt auch fuer
 * die aktuelle Auswahl.
 */
export class ToolRail extends BaseElement {
  static override styles = [BaseElement.styles, toolRailStyles, kindHelpStyles];

  @property({ attribute: false }) editor!: Editor;

  #observed = false;

  override connectedCallback(): void {
    super.connectedCallback();
    if (this.#observed) return;
    this.#observed = true;
    new StoreController(this, this.editor.ui);
  }

  #renderSample(kind: DrawKind): TemplateResult {
    return html`<svg class="sample" viewBox="0 0 28 4" aria-hidden="true">
      ${svg`<line class="sample-line ${kind}" x1="0" y1="2" x2="28" y2="2"></line>`}
    </svg>`;
  }

  #renderBadge(isOn: boolean): TemplateResult {
    return html`<span class=${isOn ? 'badge on' : 'badge'} aria-hidden="true"
      >${isOn ? editorText().tools.on : editorText().tools.off}</span
    >`;
  }

  #setSnap(key: keyof SnapSettings, value: boolean): void {
    this.editor.updateUi({ snaps: { ...this.editor.ui.get().snaps, [key]: value } });
  }

  #toggleAllSnaps(snaps: SnapSettings): void {
    const isOn = !Object.values(snaps).some(Boolean);
    this.editor.updateUi({
      snaps: { vertices: isOn, midpoints: isOn, intersections: isOn, grid: isOn },
    });
  }

  #renderTools(tool: Tool): TemplateResult {
    const tools = editorText().tools;
    return html`
      <h2>${tools.tool}</h2>
      <ul>
        ${TOOLS.map(
          (entry) =>
            html`<li>
              <button
                class="row"
                type="button"
                aria-pressed=${entry.value === tool ? 'true' : 'false'}
                aria-keyshortcuts=${entry.key}
                @click=${() => this.editor.updateUi({ tool: entry.value })}
              >
                <b class="key" aria-hidden="true">${entry.key}</b>${tools.labels[entry.value]}
              </button>
            </li>`,
        )}
      </ul>
    `;
  }

  #renderKinds(kind: DrawKind): TemplateResult {
    const help = editorText().kindHelp.texts;
    return html`
      <h2>${editorText().tools.kind}</h2>
      <ul>
        ${KINDS.map(
          (entry) =>
            html`<li>
              <button
                class="row kind"
                type="button"
                aria-pressed=${entry === kind ? 'true' : 'false'}
                title=${help[entry]}
                @click=${() => this.editor.setKind(entry)}
              >
                ${this.#renderSample(entry)}${common().kinds[entry]}
              </button>
            </li>`,
        )}
      </ul>
      ${renderKindHelp()}
    `;
  }

  #renderAids(symmetry: boolean, snaps: SnapSettings): TemplateResult {
    const isSnapping = Object.values(snaps).some(Boolean);
    const tools = editorText().tools;
    return html`
      <h2>${tools.aids}</h2>
      <ul>
        <li>
          <button
            class="row toggle"
            type="button"
            aria-pressed=${symmetry ? 'true' : 'false'}
            @click=${() => this.editor.updateUi({ symmetry: !symmetry })}
          >
            ${this.#renderBadge(symmetry)}${tools.symmetry}
          </button>
        </li>
        <li>
          <button
            class="row toggle"
            type="button"
            aria-pressed=${isSnapping ? 'true' : 'false'}
            @click=${() => this.#toggleAllSnaps(snaps)}
          >
            ${this.#renderBadge(isSnapping)}${tools.snapping}
          </button>
        </li>
      </ul>
      <ul class="targets" aria-label=${tools.snapTo}>
        ${SNAP_TARGETS.map(
          (target) =>
            html`<li>
              <button
                class="target"
                type="button"
                aria-pressed=${snaps[target] ? 'true' : 'false'}
                @click=${() => this.#setSnap(target, !snaps[target])}
              >
                ${tools.targets[target]}
              </button>
            </li>`,
        )}
      </ul>
    `;
  }

  protected override render(): TemplateResult {
    const ui = this.editor.ui.get();
    return html`
      <nav class="tools" aria-label=${editorText().tools.nav}>
        ${this.#renderTools(ui.tool)} ${this.#renderKinds(ui.kind)}
        ${this.#renderAids(ui.symmetry, ui.snaps)}
        <p class="hint">${editorText().tools.hints[ui.tool]}</p>
      </nav>
    `;
  }
}
