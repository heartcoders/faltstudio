import { html, type TemplateResult } from 'lit';
import { BaseElement } from '../../internal/base-element.js';
import { emit } from '../../internal/emit.js';
import { getLocale, LOCALES, setLocale, type Locale } from '../../i18n/locale.js';
import { localeSwitchStyles } from './locale-switch.styles.js';

const NAMES: Readonly<Record<Locale, string>> = { de: 'Deutsch', en: 'English' };

/**
 * Sprachwahl DE | EN als zwei Textaktionen; die aktive ist unterstrichen.
 * Gilt fuer die ganze App und wird im Browser gemerkt.
 *
 * @fires change - detail: neue Sprache.
 */
export class LocaleSwitch extends BaseElement {
  static override styles = [BaseElement.styles, localeSwitchStyles];

  #handleSelect(locale: Locale): void {
    if (locale === getLocale()) return;
    setLocale(locale);
    emit(this, 'change', locale);
  }

  protected override render(): TemplateResult {
    const active = getLocale();
    return html`<div class="switch" role="group" aria-label="Sprache · Language">
      ${LOCALES.map(
        (locale) =>
          html`<button
            type="button"
            lang=${locale}
            aria-pressed=${locale === active ? 'true' : 'false'}
            aria-label=${NAMES[locale]}
            @click=${() => this.#handleSelect(locale)}
          >
            ${locale.toUpperCase()}
          </button>`,
      )}
    </div>`;
  }
}
