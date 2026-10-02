import { html, nothing, type TemplateResult } from 'lit';
import { property, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { BaseElement } from '../../internal/base-element.js';
import { enumProp, boolProp, checkEnum } from '../../internal/enum-prop.js';
import { part } from '../../internal/part.js';
import { TONES, SIZES, type Tone, type Size } from '../../internal/scales.js';
import { DEV } from '../../internal/dev.js';
import { buttonStyles } from './button.styles.js';

export const BUTTON_VARIANTS = ['auto', 'primary', 'secondary', 'tertiary'] as const;
export const BUTTON_TYPES = ['button', 'submit', 'reset'] as const;

export type ButtonVariant = (typeof BUTTON_VARIANTS)[number];
export type ButtonType = (typeof BUTTON_TYPES)[number];

/**
 * Referenzkomponente fuer das Varianten-Vokabular: `variant` x `tone` x `size`
 * als Klassennamen ueber `classMap`, ein Stylesheet fuer alle Instanzen.
 *
 * @slot - Die Beschriftung.
 * @fires click - Nativ, bubbles und composed. Im disabled-Zustand unterdrueckt.
 * @csspart control - Das gerenderte <button>.
 */
export class Button extends BaseElement {
  static override styles = [BaseElement.styles, buttonStyles];

  static override shadowRootOptions: ShadowRootInit = {
    ...BaseElement.shadowRootOptions,
    delegatesFocus: true,
  };

  @enumProp(BUTTON_VARIANTS, 'auto')
  variant: ButtonVariant = 'auto';

  @enumProp(TONES, 'auto')
  tone: Tone = 'auto';

  @enumProp(SIZES, 'base')
  size: Size = 'base';

  @enumProp(BUTTON_TYPES, 'button')
  type: ButtonType = 'button';

  @boolProp()
  disabled = false;

  /** Gespiegelt als aria-pressed. Fuer Werkzeug- und Modus-Umschalter. */
  @property({ reflect: true })
  pressed?: 'true' | 'false';

  /** Quadratischer 44x44-Icon-Button. Braucht `accessibility-label`. */
  @boolProp()
  square = false;

  /** Label links, slot="end" (z.B. Pfeil) rechts, wie WEITER → im Design. */
  @boolProp()
  trailing = false;

  @property({ attribute: 'accessibility-label', reflect: true })
  accessibilityLabel?: string;

  @query('.control') private control?: HTMLButtonElement | null;

  /**
   * HTMLElement.click() feuert nur am Host und erreicht das Control im Shadow
   * Root nie. Ohne dieses Override waere `el.click()` eine stille Nulloperation.
   */
  override click(): void {
    if (this.disabled) return;
    this.control?.click();
  }

  /** Firefox delegiert den Fokus bei `display: contents` am Host nicht. */
  override focus(options?: FocusOptions): void {
    if (this.control) this.control.focus(options);
    else super.focus(options);
  }

  protected override willUpdate(): void {
    if (!DEV) return;
    if (this.square && !this.accessibilityLabel) this.warn('square braucht accessibility-label.');
    const warn = this.warn.bind(this);
    checkEnum(BUTTON_VARIANTS, this.variant, 'variant', warn);
    checkEnum(TONES, this.tone, 'tone', warn);
    checkEnum(SIZES, this.size, 'size', warn);
    checkEnum(BUTTON_TYPES, this.type, 'type', warn);
  }

  /**
   * Ein Shadow-DOM-<button type="submit"> sendet ein Light-DOM-<form> nicht ab.
   * Das innere Element ist darum immer type="button", Submit und Reset laufen hier.
   */
  #onClick(event: MouseEvent): void {
    if (this.disabled) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    if (this.type === 'button') return;
    const form = this.closest('form');
    if (!form) return;
    event.preventDefault();
    if (this.type === 'submit') form.requestSubmit();
    else form.reset();
  }

  protected override render(): TemplateResult {
    const classes = classMap({
      control: true,
      [`variant-${this.variant}`]: true,
      [`tone-${this.tone}`]: true,
      [`size-${this.size}`]: true,
      square: this.square,
      trailing: this.trailing,
    });

    return html`
      <button
        class=${classes}
        part=${part('control')}
        type="button"
        ?disabled=${this.disabled}
        aria-pressed=${this.pressed ?? nothing}
        aria-label=${this.accessibilityLabel ?? nothing}
        @click=${this.#onClick}
      >
        <slot></slot>
        <slot name="end" aria-hidden="true"></slot>
      </button>
    `;
  }
}
