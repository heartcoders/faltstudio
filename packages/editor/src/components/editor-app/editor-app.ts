import { html, nothing, type TemplateResult } from 'lit';
import { query, state } from 'lit/decorators.js';
import { TutorialFormatError, serializeFold } from '@faltstudio/core';
import { BaseElement } from '@faltstudio/ui';
import '@faltstudio/ui/locale-switch';
import { common } from '../../i18n/common.js';
import { editorText } from '../../i18n/editor.js';
import { bootDocument } from '../../state/boot.js';
import { readRoute, readStartMode } from '../../state/route.js';
import { Editor } from '../../state/editor.js';
import type { TOOLS } from '../../state/editor-state.js';
import { downloadText, fileNameFor, pickTextFile } from '../../state/files.js';
import { StoreController } from '../../state/store-controller.js';
import { collectIssues } from '../../state/issues.js';
import { ViewportController } from '../../state/viewport.js';
import type { FileCommand } from '../file-menu/file-menu.js';
import { positionText, measureText, snapText } from '../mode-lines/readout.js';
import type { ModeLines } from '../mode-lines/mode-lines.js';
import type { EditorMode } from './modes.js';
import { editorAppStyles } from './editor-app.styles.js';

const TOOL_KEYS: Readonly<Record<string, (typeof TOOLS)[number]>> = {
  v: 'select',
  l: 'line',
  m: 'measure',
};

const isTyping = (event: KeyboardEvent): boolean =>
  event
    .composedPath()
    .some((target) => target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement);

/**
 * Layout, Modus-Umschaltung, Tastenkuerzel und Dateibefehle. Haelt die
 * Editor-Instanz (Store) und reicht sie an die Modus-Ansichten weiter.
 */
export class EditorApp extends BaseElement {
  static override styles = [BaseElement.styles, editorAppStyles];

  @state() private mode: EditorMode = readStartMode(location.search);
  @state() private editor: Editor | undefined;
  @state() private issuesOpen = false;
  @state() private menuOpen = false;
  /** Fertig-Sheet: Abschluss oder direkt Teilen. */
  @state() private finishing: 'done' | 'share' | undefined;
  readonly #viewport = new ViewportController(this);
  @query('fl-mode-lines') private linesView?: ModeLines | null;

  readonly #onKeydown = (event: KeyboardEvent): void => this.#handleKey(event);

  override connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener('keydown', this.#onKeydown);
    void this.#boot();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener('keydown', this.#onKeydown);
  }

  async #boot(): Promise<void> {
    const route = readRoute(location.search, location.hash);
    const boot = await bootDocument(route);
    const editor = new Editor(boot.document, boot.modelId);
    new StoreController(this, editor.document, editor.ui, editor.cursor);
    editor.updateUi({ message: boot.message });
    this.editor = editor;
    if (route.kind === 'shared') await editor.flush();
  }

  #handleKey(event: KeyboardEvent): void {
    const editor = this.editor;
    if (!editor || isTyping(event)) return;
    const command = event.metaKey || event.ctrlKey;
    const key = event.key.toLowerCase();
    if (command && key === 'z')
      return this.#consume(event, () => (event.shiftKey ? editor.redo() : editor.undo()));
    if (command && key === 's') return this.#consume(event, () => this.#runCommand('save'));
    if (command && key === 'o') return this.#consume(event, () => this.#runCommand('open'));
    if (command) return;
    if (key === 'escape') return this.#consume(event, () => this.#escape());
    if ((key === 'delete' || key === 'backspace') && this.mode === 'steps')
      return this.#consume(event, () => editor.steps.remove());
    if (key === 'delete' || key === 'backspace')
      return this.#consume(event, () => editor.deleteSelection());
    if (this.mode === 'steps' && (key === 'arrowleft' || key === 'arrowright'))
      return this.#consume(event, () =>
        this.#stepKey(editor, key === 'arrowleft' ? -1 : 1, event.altKey),
      );
    const tool = TOOL_KEYS[key];
    if (tool && this.mode === 'lines') this.#consume(event, () => editor.updateUi({ tool }));
  }

  #stepKey(editor: Editor, delta: number, move: boolean): void {
    const { index } = editor.steps;
    if (move) editor.steps.move(index, index + delta);
    else editor.steps.select(index + delta);
  }

  #consume(event: KeyboardEvent, action: () => unknown): void {
    event.preventDefault();
    action();
  }

  #escape(): void {
    this.issuesOpen = false;
    this.finishing = undefined;
    this.linesView?.cancelGesture();
    this.editor?.select([]);
  }

  async #runCommand(command: FileCommand): Promise<void> {
    const editor = this.editor;
    if (!editor) return;
    if (command === 'share') return void (this.finishing = 'share');
    if (command === 'new') return editor.newDocument();
    if (command === 'embed') return this.#copyEmbed(editor);
    if (command === 'save')
      return downloadText(editor.serialize(), fileNameFor(editor.document.get().meta.title));
    if (command === 'export')
      return downloadText(
        serializeFold(editor.document.get()),
        fileNameFor(editor.document.get().meta.title).replace(/\.json$/, '.fold'),
      );
    await this.#open(editor);
  }

  async #copyEmbed(editor: Editor): Promise<void> {
    const snippet = `<fl-viewer src="${fileNameFor(editor.document.get().meta.title)}"></fl-viewer>`;
    try {
      await navigator.clipboard.writeText(snippet);
      editor.updateUi({ message: editorText().messages.embedCopied });
    } catch {
      editor.updateUi({ message: snippet });
    }
  }

  async #open(editor: Editor): Promise<void> {
    try {
      const text = await pickTextFile();
      if (text !== undefined) editor.open(text);
    } catch (error) {
      const detail =
        error instanceof TutorialFormatError
          ? error.issues
              .slice(0, 3)
              .map((issue) => `${issue.path}: ${issue.message}`)
              .join(' · ')
          : '';
      const reason = `${error instanceof Error ? error.message : String(error)} ${detail}`.trim();
      editor.updateUi({ message: editorText().messages.openFailed(reason) });
    }
  }

  #stepStatus(editor: Editor): readonly string[] {
    const { steps } = editor;
    const fold = steps.fold;
    const status = editorText().status;
    const kinds = common().kinds;
    const items = [
      status.stepOf(
        String(steps.index + 1).padStart(2, '0'),
        String(steps.steps.length).padStart(2, '0'),
      ),
    ];
    if (fold)
      items.push(
        status.axis(
          fold.creaseIds.join(' + '),
          fold.angle < 0 ? kinds.mountain : kinds.valley,
          Math.abs(fold.angle).toFixed(1),
        ),
      );
    if (steps.issues.length > 0) items.push(status.stepsWithIssues(steps.issues.length));
    return items;
  }

  #photoStatus(editor: Editor): readonly string[] {
    const reference = editor.document.get().reference;
    const ui = editor.ui.get();
    const status = editorText().status;
    if (!reference) return [status.noPhoto, ...(ui.message ? [ui.message] : [])];
    const corner = ui.cornerDraft?.point ?? reference.corners[ui.activeCorner];
    const items = [
      status.handleActive(ui.activeCorner + 1),
      status.opacity(Math.round((ui.opacityDraft ?? reference.opacity) * 100)),
    ];
    return corner
      ? [`X ${Math.round(corner[0])} px · Y ${Math.round(corner[1])} px`, ...items]
      : items;
  }

  #statusItems(editor: Editor): readonly string[] {
    if (this.mode === 'photo') return this.#photoStatus(editor);
    if (this.mode === 'steps' || this.mode === 'preview') return this.#stepStatus(editor);
    const cursor = editor.cursor.get();
    const message = editor.ui.get().message;
    const items: string[] = [];
    if (cursor.point) items.push(positionText(cursor.point));
    if (cursor.point && cursor.start)
      items.push(...Object.values(measureText(cursor.start, cursor.point)));
    const snap = snapText(cursor);
    if (snap) items.push(snap);
    if (message) items.push(message);
    return items;
  }

  #renderMode(editor: Editor): TemplateResult {
    const mobile = this.#viewport.mobile;
    if (this.mode === 'photo')
      return html`<fl-mode-photo
        .editor=${editor}
        ?mobile=${mobile}
        @apply=${() => (this.mode = 'lines')}
      ></fl-mode-photo>`;
    if (this.mode === 'steps')
      return html`<fl-mode-steps .editor=${editor} ?mobile=${mobile}></fl-mode-steps>`;
    if (this.mode === 'preview')
      return html`<fl-mode-preview .editor=${editor} ?mobile=${mobile}></fl-mode-preview>`;
    return html`<fl-mode-lines .editor=${editor} ?mobile=${mobile}></fl-mode-lines>`;
  }

  #renderIssues(editor: Editor, sheet = false): TemplateResult {
    return html`<fl-issues-panel
      .editor=${editor}
      ?sheet=${sheet}
      @close=${() => (this.issuesOpen = false)}
      @navigate=${(event: CustomEvent<EditorMode>) => {
        this.mode = event.detail;
        this.issuesOpen = false;
      }}
    ></fl-issues-panel>`;
  }

  /** Mobil: Datei-Menue als Sheet mit den Befehlen im Daumenbereich (Design M2). */
  #renderFileSheet(): TemplateResult {
    const commands: readonly (FileCommand | 'done')[] = [
      'done',
      'new',
      'open',
      'save',
      'export',
      'embed',
      'share',
    ];
    const file = editorText().file;
    return html`
      <div class="sheet-layer" @click=${this.#closeSheets}>
        <fl-sheet
          level="half"
          label=${file.title}
          @change=${(event: CustomEvent<string>) => event.detail === 'peek' && (this.menuOpen = false)}
        >
          <p slot="head" class="sheet-head">${file.title}</p>
          <ul class="commands">
            ${commands.map(
              (command, index) =>
                html`<li>
                  <button
                    type="button"
                    @click=${() => {
                      this.menuOpen = false;
                      if (command === 'done') this.finishing = 'done';
                      else void this.#runCommand(command);
                    }}
                  >
                    <span class="number">${String(index + 1).padStart(2, '0')}</span
                    ><span>${file.labels[command]}</span
                    ><span class="note">${file.notes[command]}</span>
                  </button>
                </li>`,
            )}
          </ul>
          <p class="language">
            <span>${editorText().language}</span><fl-locale-switch></fl-locale-switch>
          </p>
          <div class="sheet-foot">
            <button class="close" type="button" @click=${() => (this.menuOpen = false)}>
              ${common().close}
            </button>
          </div>
        </fl-sheet>
      </div>
    `;
  }

  #renderDone(editor: Editor): TemplateResult | typeof nothing {
    if (!this.finishing) return nothing;
    return html`<fl-done-sheet
      .editor=${editor}
      ?sharing=${this.finishing === 'share'}
      @close=${() => (this.finishing = undefined)}
    ></fl-done-sheet>`;
  }

  /** Tippen auf die abgedunkelte Flaeche schliesst das Sheet. */
  readonly #closeSheets = (event: Event): void => {
    if (event.target !== event.currentTarget) return;
    this.menuOpen = false;
    this.issuesOpen = false;
  };

  #renderMobile(editor: Editor): TemplateResult {
    const document = editor.document.get();
    const ui = editor.ui.get();
    const issues = collectIssues(editor);
    return html`
      <fl-mobile-head
        .mode=${this.mode}
        document=${fileNameFor(document.meta.title)}
        status=${ui.savedAt ? editorText().savedDraft(ui.savedAt) : editorText().notSaved}
        errors=${issues.filter((issue) => issue.severity === 'error').length}
        warnings=${issues.filter((issue) => issue.severity === 'warning').length}
        @modechange=${(event: CustomEvent<EditorMode>) => (this.mode = event.detail)}
        @issues=${() => (this.issuesOpen = true)}
        @menu=${() => (this.menuOpen = true)}
      ></fl-mobile-head>
      <main class="workspace">${this.#renderMode(editor)}</main>
      ${this.menuOpen ? this.#renderFileSheet() : nothing} ${this.#renderDone(editor)}
      ${
        this.issuesOpen
          ? html`<div class="sheet-layer" @click=${this.#closeSheets}>
              <fl-sheet
                level="full"
                label=${editorText().issues}
                @change=${(event: CustomEvent<string>) => event.detail === 'peek' && (this.issuesOpen = false)}
                >${this.#renderIssues(editor, true)}</fl-sheet
              >
            </div>`
          : nothing
      }
    `;
  }

  protected override render(): TemplateResult | typeof nothing {
    const editor = this.editor;
    if (!editor) return nothing;
    if (this.#viewport.mobile) return this.#renderMobile(editor);
    const document = editor.document.get();
    const ui = editor.ui.get();
    const issues = collectIssues(editor);
    return html`
      <fl-editor-header
        .mode=${this.mode}
        document=${document.meta.title || fileNameFor(document.meta.title)}
        status=${ui.savedAt ? editorText().savedDraft(ui.savedAt) : editorText().notSaved}
        errors=${issues.filter((issue) => issue.severity === 'error').length}
        warnings=${issues.filter((issue) => issue.severity === 'warning').length}
        ?issues-open=${this.issuesOpen}
        @modechange=${(event: CustomEvent<EditorMode>) => (this.mode = event.detail)}
        @issues=${() => (this.issuesOpen = !this.issuesOpen)}
        @command=${(event: CustomEvent<FileCommand>) => void this.#runCommand(event.detail)}
        @done=${() => (this.finishing = 'done')}
      ></fl-editor-header>
      <main
        class="workspace"
        @navigate=${(event: CustomEvent<EditorMode>) => {
          this.mode = event.detail;
          this.issuesOpen = false;
        }}
        @issues=${() => (this.issuesOpen = true)}
      >
        ${this.#renderMode(editor)}
        ${this.issuesOpen ? html`<div class="issues-popover">${this.#renderIssues(editor)}</div>` : nothing}
      </main>
      <fl-status-bar .items=${this.#statusItems(editor)}></fl-status-bar>
      ${this.#renderDone(editor)}
    `;
  }
}
