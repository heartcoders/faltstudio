import { html, nothing, type TemplateResult } from 'lit';
import { parseTutorial } from '@faltstudio/core';
import type { StoredModel } from '../../state/library.js';
import { viewHref } from '../../state/route.js';
import { common } from '../../i18n/common.js';
import { startText } from '../../i18n/start.js';
import { stepCount } from '../../state/step-count.js';
import { displayTitle, formatDate, type CardData } from './model-card-data.js';

/** Welche Ansicht das Modellmenue gerade zeigt. */
export type OverlayView = 'menu' | 'share' | 'delete';

/** Was das Modellmenue zum Zeichnen braucht. */
export interface OverlayContext {
  readonly model: StoredModel;
  readonly data: CardData;
  readonly view: OverlayView;
  readonly onView: (view: OverlayView) => void;
  readonly onClose: () => void;
  readonly onDelete: () => void;
}

function renderMenu({ model, onView }: OverlayContext): TemplateResult {
  const text = startText().overlay;
  return html`<div class="menu">
    <a class="menu-row" href=${viewHref({ kind: 'model', id: model.id })}
      ><span>${text.viewGuide}</span><span aria-hidden="true">→</span></a
    >
    <button class="menu-row" type="button" @click=${() => onView('share')}>
      <span>${text.shareQr}</span><span aria-hidden="true">⌗</span>
    </button>
    <button class="menu-row" type="button" @click=${() => onView('delete')}>
      <span>${text.delete}</span><span aria-hidden="true">×</span>
    </button>
  </div>`;
}

function renderDeleteConfirm({ model, data, onClose, onDelete }: OverlayContext): TemplateResult {
  const text = startText().overlay;
  return html`
    <p class="overlay-meta">
      ${stepCount(data.steps)} · ${data.sheet} · ${text.changed(formatDate(model.updatedAt))}
    </p>
    <p class="confirm-text">${text.deleteText(stepCount(data.steps))}</p>
    <div class="confirm-actions">
      <button class="secondary" type="button" @click=${onClose}>${common().cancel}</button>
      <button class="primary" type="button" @click=${onDelete}>${text.deleteConfirm}</button>
    </div>
  `;
}

function renderShare({ model }: OverlayContext): TemplateResult {
  try {
    return html`<fl-share-panel .tutorial=${parseTutorial(model.text)}></fl-share-panel>`;
  } catch {
    return html`<p class="confirm-text">${startText().overlay.shareDamaged}</p>`;
  }
}

const heading = (view: OverlayView, data: CardData): string =>
  view === 'menu'
    ? displayTitle(data)
    : view === 'delete'
      ? startText().overlay.deleteHeading
      : startText().overlay.share;

function renderBody(context: OverlayContext): TemplateResult {
  if (context.view === 'delete') return renderDeleteConfirm(context);
  if (context.view === 'share') return renderShare(context);
  return renderMenu(context);
}

/**
 * Modellmenue der Startseite als Sheet (mobil) oder mittiger Dialog (Desktop).
 *
 * @param context - Modell, Ansicht und Rueckrufe.
 * @param floating - Mittig statt am unteren Rand.
 * @returns Abgedunkelte Ebene mit dem Sheet.
 */
export function renderModelOverlay(context: OverlayContext, floating: boolean): TemplateResult {
  const title = heading(context.view, context.data);
  const handleBackdrop = (event: Event): void => {
    if (event.target === event.currentTarget) context.onClose();
  };
  return html`
    <div class="overlay" @click=${handleBackdrop}>
      <fl-sheet
        level=${context.view === 'share' ? 'full' : 'half'}
        label=${title}
        ?floating=${floating}
        @change=${(event: CustomEvent<string>) => event.detail === 'peek' && context.onClose()}
      >
        <div slot="head" class="sheet-head">
          <p>${title}</p>
          <button
            class="close"
            type="button"
            aria-label=${common().close}
            @click=${context.onClose}
          >
            ×
          </button>
        </div>
        <div class="overlay-body">
          ${
            context.view === 'menu'
              ? nothing
              : html`<p class="confirm-title">${displayTitle(context.data)}</p>`
          }
          ${renderBody(context)}
        </div>
      </fl-sheet>
    </div>
  `;
}
