import { LitElement, css, type CSSResultGroup } from 'lit';
import { hostStyles } from './host-styles.js';
import { t } from './tokens.js';
import { DEV } from './dev.js';
import { PREFIX } from '../config.js';
import { LocaleController } from '../i18n/locale.js';

const boxSizing = css`
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }
`;

/**
 * Typografie liegt auf dem gerenderten Root, nicht auf :host. Im Lockdown hat
 * der Host keine Box, die Vererbung an das Root funktioniert trotzdem.
 */
const typography = css`
  :host > * {
    font-family: ${t('font-mono')};
    font-size: ${t('text-body')};
    line-height: ${t('line-height')};
    color: ${t('text')};
    -webkit-font-smoothing: antialiased;
  }
`;

export class BaseElement extends LitElement {
  /** Subklassen verschachteln: `static styles = [BaseElement.styles, ownStyles]`. */
  static override styles: CSSResultGroup = [hostStyles, boxSizing, typography];

  /** Jede Komponente zeichnet sich bei einem Sprachwechsel neu. */
  constructor() {
    super();
    new LocaleController(this);
  }

  protected warn(...args: readonly unknown[]): void {
    if (DEV) console.warn(`[${PREFIX}] <${this.localName}>:`, ...args);
  }
}
