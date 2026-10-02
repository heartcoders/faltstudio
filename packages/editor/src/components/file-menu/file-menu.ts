import { html, nothing, type TemplateResult } from 'lit';
import { state } from 'lit/decorators.js';
import { BaseElement, emit } from '@faltstudio/ui';
import '@faltstudio/ui/locale-switch';
import { editorText } from '../../i18n/editor.js';
import { fileMenuStyles } from './file-menu.styles.js';

export const FILE_COMMANDS = ['new', 'open', 'save', 'export', 'embed', 'share'] as const;
export type FileCommand = (typeof FILE_COMMANDS)[number];

interface CommandEntry {
  readonly command: FileCommand;
  readonly shortcut: string;
}

const ENTRIES: readonly CommandEntry[] = [
  { command: 'new', shortcut: '⌘N' },
  { command: 'open', shortcut: '⌘O' },
  { command: 'save', shortcut: '⌘S' },
  { command: 'export', shortcut: '⇧⌘E' },
  { command: 'embed', shortcut: '' },
  { command: 'share', shortcut: '' },
];

/**
 * Dateimenue (M1 · Datei). Schliesst per Escape, Klick ausserhalb oder Auswahl.
 *
 * @fires command - detail: der gewaehlte Befehl.
 */
export class FileMenu extends BaseElement {
  static override styles = [BaseElement.styles, fileMenuStyles];

  @state() private open = false;

  readonly #onDocumentPointer = (event: PointerEvent): void => {
    if (!event.composedPath().includes(this)) this.open = false;
  };

  override connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener('pointerdown', this.#onDocumentPointer);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('pointerdown', this.#onDocumentPointer);
  }

  #onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape' || !this.open) return;
    this.open = false;
    this.shadowRoot?.querySelector<HTMLElement>('.trigger')?.focus();
  }

  #choose(command: FileCommand): void {
    this.open = false;
    emit(this, 'command', command);
  }

  #renderEntry(entry: CommandEntry, index: number): TemplateResult {
    return html`
      <li>
        <button class="entry" type="button" @click=${() => this.#choose(entry.command)}>
          <span class="number">${String(index + 1).padStart(2, '0')}</span>
          <span>${editorText().file.menuLabels[entry.command]}</span>
          <kbd>${entry.shortcut}</kbd>
        </button>
      </li>
    `;
  }

  #renderMenu(): TemplateResult | typeof nothing {
    if (!this.open) return nothing;
    const msg = editorText();
    return html`
      <nav class="menu" id="menu" aria-label=${msg.file.title}>
        <p class="menu-head">
          <span>${msg.file.menuHead}</span><span>${msg.file.commandCount(ENTRIES.length)}</span>
        </p>
        <ul class="entries">
          ${ENTRIES.map((entry, index) => this.#renderEntry(entry, index))}
        </ul>
        <p class="language"><span>${msg.language}</span><fl-locale-switch></fl-locale-switch></p>
      </nav>
    `;
  }

  protected override render(): TemplateResult {
    return html`
      <span class="file-menu" @keydown=${this.#onKeydown}>
        <button
          class="trigger"
          type="button"
          aria-expanded=${this.open ? 'true' : 'false'}
          aria-controls="menu"
          @click=${() => (this.open = !this.open)}
        >
          ${editorText().file.title}
        </button>
        ${this.#renderMenu()}
      </span>
    `;
  }
}
