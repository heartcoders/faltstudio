import { html, svg, type TemplateResult } from 'lit';
import type { DrawKind } from '../../state/editor-state.js';
import { common } from '../../i18n/common.js';

/** Name der Faltart in der aktuellen Sprache; Randlinien gelten als flach. */
export const kindLabel = (kind: DrawKind | 'border'): string =>
  common().kinds[kind === 'border' ? 'flat' : kind];

const KIND_CYCLE: readonly DrawKind[] = ['valley', 'mountain', 'flat'];

/** Art-Umschalter (C12): eine Taste statt drei, Tippen wechselt reihum. */
export const nextKind = (kind: DrawKind): DrawKind =>
  KIND_CYCLE[(KIND_CYCLE.indexOf(kind) + 1) % KIND_CYCLE.length] ?? 'valley';

/** Strichmuster der Faltart als kleine Probe. */
export function kindSample(kind: DrawKind, width = 44): TemplateResult {
  return html`<svg
    class="sample"
    viewBox="0 0 ${width} 4"
    width=${width}
    height="4"
    aria-hidden="true"
  >
    ${svg`<line class="sample-line ${kind}" x1="0" y1="2" x2=${width} y2="2"></line>`}
  </svg>`;
}
