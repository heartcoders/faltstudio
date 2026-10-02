import { css, html, svg, type TemplateResult } from 'lit';
import { focusRing, microText, t } from '@faltstudio/ui';
import type { DrawKind } from '../state/editor-state.js';
import { common } from '../i18n/common.js';
import { editorText } from '../i18n/editor.js';

const ALL_KINDS: readonly DrawKind[] = ['valley', 'mountain', 'flat'];

function renderSample(kind: DrawKind): TemplateResult {
  return html`<svg class="help-sample" viewBox="0 0 28 4" aria-hidden="true">
    ${svg`<line class="help-line ${kind}" x1="0" y1="2" x2="28" y2="2"></line>`}
  </svg>`;
}

/**
 * Aufklappbare Erklaerung „Was heisst Tal und Berg?“ neben jeder Faltart-Wahl.
 *
 * @param kinds - Welche Faltarten erklaert werden; Schritte kennen nur Tal und Berg.
 * @returns Ein `details`-Element, zugeklappt.
 */
export function renderKindHelp(kinds: readonly DrawKind[] = ALL_KINDS): TemplateResult {
  const labels = common().kinds;
  const help = editorText().kindHelp;
  return html`<details class="kind-help">
    <summary>${help.question(kinds.map((kind) => labels[kind]).join(' / '))}</summary>
    <dl>
      ${kinds.map(
        (kind) =>
          html`<div>
            <dt>${renderSample(kind)}${labels[kind]}</dt>
            <dd>${help.texts[kind]}</dd>
          </div>`,
      )}
    </dl>
  </details>`;
}

/** Styles zu `renderKindHelp`; in jede Komponente aufnehmen, die die Hilfe zeigt. */
export const kindHelpStyles = css`
  .kind-help {
    text-transform: none;
    letter-spacing: normal;
  }

  .kind-help summary {
    display: flex;
    align-items: center;
    min-block-size: ${t('hit')};
    ${microText}
    color: ${t('text-secondary')};
    text-decoration: underline;
    text-underline-offset: 4px;
    cursor: pointer;
  }

  .kind-help summary:focus-visible {
    ${focusRing}
  }

  .kind-help dl {
    display: grid;
    gap: ${t('space-3')};
    margin: 0 0 ${t('space-3')};
  }

  .kind-help dt {
    display: flex;
    align-items: center;
    gap: ${t('space-2')};
    font-size: ${t('text-label-size')};
    font-weight: 700;
    letter-spacing: ${t('track-label')};
    text-transform: uppercase;
    color: ${t('text')};
  }

  .kind-help dd {
    margin: ${t('space-1')} 0 0;
    font-size: 12px;
    line-height: ${t('line-height')};
    color: ${t('text-secondary')};
  }

  .help-sample {
    display: block;
    flex: none;
    inline-size: 28px;
    block-size: 4px;
  }

  .help-line {
    stroke: currentColor;
    stroke-width: 1.5;
  }

  .help-line.valley {
    stroke-dasharray: ${t('dash-valley')};
  }

  .help-line.mountain {
    stroke-dasharray: ${t('dash-mountain')};
  }

  .help-line.flat {
    stroke-width: 1;
    stroke-dasharray: ${t('dash-flat')};
  }
`;
