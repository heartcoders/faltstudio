import { html, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { BaseElement } from '@faltstudio/ui';
import { statusBarStyles } from './status-bar.styles.js';

/**
 * Statuszeile am unteren Rand. Links Messwerte des aktuellen Werkzeugs,
 * rechts der Planstempel.
 */
export class StatusBar extends BaseElement {
  static override styles = [BaseElement.styles, statusBarStyles];

  @property({ attribute: false }) items: readonly string[] = [];
  @property() stamp = '';

  protected override render(): TemplateResult {
    return html`
      <footer class="status-bar">
        <ul class="items">
          ${this.items.map((item) => html`<li>${item}</li>`)}
        </ul>
        ${this.stamp ? html`<p class="stamp">${this.stamp}</p>` : ''}
      </footer>
    `;
  }
}
