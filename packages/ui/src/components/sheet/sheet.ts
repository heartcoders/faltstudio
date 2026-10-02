import { html, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { BaseElement } from '../../internal/base-element.js';
import { boolProp, checkEnum, enumProp } from '../../internal/enum-prop.js';
import { DEV } from '../../internal/dev.js';
import { emit } from '../../internal/emit.js';
import { part } from '../../internal/part.js';
import { uiMsg } from '../../i18n/ui-messages.js';
import { sheetStyles } from './sheet.styles.js';

export const SHEET_LEVELS = ['peek', 'half', 'full'] as const;
export type SheetLevel = (typeof SHEET_LEVELS)[number];

/** Unter dieser Zugstrecke (px) gilt eine Geste am Griff als Tippen. */
const TAP_SLOP_PX = 6;

/**
 * Bottom Sheet fuer das mobile Layout (Design D): eingeklappt 64 px, halb, voll.
 * Am Griff ziehen oder tippen wechselt die Hoehe. Der Kopf bleibt in allen
 * Hoehen sichtbar, der Inhalt scrollt.
 *
 * @slot head - Kopfzeile, auch eingeklappt sichtbar.
 * @slot - Inhalt ab halber Hoehe.
 * @fires change - detail: neue Hoehe.
 * @csspart sheet - Das Blatt.
 */
export class Sheet extends BaseElement {
  static override styles = [BaseElement.styles, sheetStyles];

  @enumProp(SHEET_LEVELS, 'peek')
  level: SheetLevel = 'peek';

  @property({ reflect: true })
  label = '';

  /** Als Dialog mittig statt am unteren Rand (Desktop): Hoehe nach Inhalt, ohne Griff. */
  @boolProp()
  floating = false;

  #dragStart: { readonly y: number; readonly height: number } | undefined;

  protected override willUpdate(): void {
    if (DEV) checkEnum(SHEET_LEVELS, this.level, 'level', this.warn.bind(this));
  }

  #set(level: SheetLevel): void {
    if (level === this.level) return;
    this.level = level;
    emit(this, 'change', level);
  }

  #cycle(): void {
    const next: Readonly<Record<SheetLevel, SheetLevel>> = {
      peek: 'half',
      half: 'full',
      full: 'peek',
    };
    this.#set(next[this.level]);
  }

  #onDown(event: PointerEvent): void {
    const sheet = this.shadowRoot?.querySelector<HTMLElement>('.sheet');
    if (!sheet) return;
    (event.currentTarget as Element).setPointerCapture(event.pointerId);
    this.#dragStart = { y: event.clientY, height: sheet.getBoundingClientRect().height };
  }

  #onUp(event: PointerEvent): void {
    const start = this.#dragStart;
    this.#dragStart = undefined;
    if (!start) return;
    const delta = start.y - event.clientY;
    if (Math.abs(delta) < TAP_SLOP_PX) return this.#cycle();
    const target = start.height + delta;
    const viewport = globalThis.innerHeight || 800;
    this.#set(target < viewport * 0.3 ? 'peek' : target < viewport * 0.75 ? 'half' : 'full');
  }

  protected override render(): TemplateResult {
    return html`
      <section
        class="sheet level-${this.level}${this.floating ? ' floating' : ''}"
        part=${part('sheet')}
        aria-label=${this.label}
      >
        <button
          class="grip"
          type="button"
          aria-label=${uiMsg().sheetResize(this.label)}
          aria-expanded=${this.level === 'peek' ? 'false' : 'true'}
          @pointerdown=${(event: PointerEvent) => this.#onDown(event)}
          @pointerup=${(event: PointerEvent) => this.#onUp(event)}
          @keydown=${(event: KeyboardEvent) => (event.key === 'Enter' || event.key === ' ') && (event.preventDefault(), this.#cycle())}
        >
          <span class="bar" aria-hidden="true"></span>
          <span class="level">${uiMsg().sheetLevel[this.level]}</span>
        </button>
        <div class="head"><slot name="head"></slot></div>
        <div class="body"><slot></slot></div>
      </section>
    `;
  }
}
