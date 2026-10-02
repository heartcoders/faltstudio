import {
  SHEET_A4,
  addLines,
  defaultCorners,
  moveCorner,
  setReference,
  setReferenceOpacity,
  setSheet,
  type Sheet,
  checkFlatFoldability,
  checkLines,
  createDocument,
  createStore,
  memoizeLast,
  nextLineId,
  parseTutorial,
  preparePattern,
  removeCreases,
  serializeTutorial,
  setCreaseKind,
  type CreaseId,
  type FoldPattern,
  type LineInput,
  type PatternIssue,
  type Store,
  type Tutorial,
  type Vec2,
} from '@faltstudio/core';
import { localeTag } from '@faltstudio/ui';
import { common } from '../i18n/common.js';
import { editorText } from '../i18n/editor.js';
import { createModelId, saveModel } from './library.js';
import { INITIAL_UI, type CursorState, type DrawKind, type UiState } from './editor-state.js';
import { StepEditing } from './step-editing.js';
import { RectifiedCache, loadImageFile } from './photo.js';

const DRAFT_DELAY_MS = 500;
const MIN_LINE_MM = 0.5;
/** Unter diesem Abstand zum eigenen Spiegelbild gilt eine Linie als auf der Achse gezeichnet. */
const MIRROR_TOLERANCE_MM = 2;

/** Nach dem ersten Speichern ?model=… in die Adresse schreiben, damit Neuladen das Modell findet. */
function rememberInUrl(modelId: string): void {
  if (typeof history === 'undefined' || typeof location === 'undefined') return;
  const url = new URL(location.href);
  if (url.searchParams.get('model') === modelId) return;
  url.search = `?model=${encodeURIComponent(modelId)}`;
  url.hash = '';
  history.replaceState(null, '', url);
}

const clock = (): string =>
  new Date().toLocaleTimeString(localeTag(), { hour: '2-digit', minute: '2-digit' });

/**
 * Zentrale des Editors: Dokument mit Undo-Verlauf, Bedienzustand ohne Verlauf,
 * abgeleitetes Faltmuster und Befunde. Lit-Komponenten lesen hier und rufen
 * Aktionen auf; sie halten selbst keinen Geometrie-Zustand.
 */
export class Editor {
  readonly document: Store<Tutorial>;
  readonly ui: Store<UiState> = createStore(INITIAL_UI, { historyLimit: 0 });
  readonly cursor: Store<CursorState> = createStore<CursorState>({}, { historyLimit: 0 });
  readonly steps: StepEditing = new StepEditing(this);
  readonly #rectified = new RectifiedCache(() => this.updateUi({}));

  readonly #pattern = memoizeLast(preparePattern);
  readonly #issues = memoizeLast((pattern: FoldPattern): readonly PatternIssue[] => [
    ...checkFlatFoldability(pattern.graph),
    ...checkLines(pattern.graph, this.document.get().sheet, pattern.dangling),
  ]);
  #draftTimer: ReturnType<typeof setTimeout> | undefined;

  /** Modell in der Bibliothek, in das dieser Editor speichert. */
  modelId: string;

  constructor(initial: Tutorial = createDocument(SHEET_A4), modelId: string = createModelId()) {
    this.modelId = modelId;
    this.document = createStore(initial);
    this.document.subscribe(() => this.#scheduleDraft());
  }

  get pattern(): FoldPattern {
    return this.#pattern(this.document.get());
  }

  get issues(): readonly PatternIssue[] {
    return this.#issues(this.pattern);
  }

  updateUi(change: Partial<UiState>): void {
    this.ui.set((state) => ({ ...state, ...change }));
  }

  /** Zeichnet eine Linie; mit Symmetrie zusaetzlich ihr Spiegelbild an der Mittelachse. */
  drawLine(a: Vec2, b: Vec2): void {
    if (Math.hypot(b[0] - a[0], b[1] - a[1]) < MIN_LINE_MM) return;
    const document = this.document.get();
    const { kind, symmetry } = this.ui.get();
    const line: LineInput = { id: nextLineId(document), a, b, kind };
    const lines = symmetry ? this.#withMirror(line, document.sheet.width) : [line];
    this.document.set(addLines(document, lines));
  }

  /**
   * Linie plus Spiegelbild an der Mittelachse. Liegt das Spiegelbild fast auf
   * der Linie selbst (von Hand fast auf die Achse gezeichnet), gibt es nur eine
   * Linie, exakt auf die Achse gelegt; sonst kreuzten sich beide in der Mitte.
   */
  #withMirror(line: LineInput, width: number): readonly LineInput[] {
    const axis = width / 2;
    const flip = ([x, y]: Vec2): Vec2 => [width - x, y];
    const near = (p: Vec2, q: Vec2): boolean =>
      Math.hypot(p[0] - q[0], p[1] - q[1]) < MIRROR_TOLERANCE_MM;
    const mirrored = { ...line, id: `${line.id}m`, a: flip(line.a), b: flip(line.b) };
    const onAxis = near(mirrored.a, line.a) && near(mirrored.b, line.b);
    const reversed = near(mirrored.a, line.b) && near(mirrored.b, line.a);
    if (onAxis) return [{ ...line, a: [axis, line.a[1]], b: [axis, line.b[1]] }];
    return reversed ? [line] : [line, mirrored];
  }

  deleteSelection(): void {
    const { selection } = this.ui.get();
    if (selection.length === 0) return;
    this.document.set(removeCreases(this.document.get(), selection));
    this.updateUi({ selection: [] });
  }

  setKind(kind: DrawKind): void {
    this.updateUi({ kind });
    const { selection } = this.ui.get();
    if (selection.length > 0)
      this.document.set(setCreaseKind(this.document.get(), selection, kind));
  }

  /** Neuer Name des Modells; leer faellt auf „Ohne Titel“ zurueck. */
  rename(title: string): void {
    const document = this.document.get();
    const next = title.trim() || common().untitled;
    if (next === document.meta.title) return;
    this.document.set({ ...document, meta: { ...document.meta, title: next } });
  }

  select(ids: readonly CreaseId[]): void {
    this.updateUi({ selection: ids });
  }

  newDocument(): void {
    this.modelId = createModelId();
    this.document.reset(createDocument(SHEET_A4));
    this.updateUi({ selection: [], message: editorText().messages.newSheet('A4') });
  }

  /** Oeffnet eine Tutorial-Datei. Wirft `TutorialFormatError` mit allen Befunden. */
  open(text: string): void {
    const document = parseTutorial(text);
    this.modelId = createModelId();
    this.document.reset(document);
    void this.#writeDraft();
    this.updateUi({ selection: [], message: editorText().messages.fileOpened });
  }

  serialize(): string {
    return serializeTutorial(this.document.get());
  }

  /** Entzerrte Vorlage fuer die Zeichenflaeche; undefined, solange sie gerechnet wird. */
  get rectifiedPhoto(): string | undefined {
    const document = this.document.get();
    return this.#rectified.get(document.reference, document.sheet);
  }

  async importPhoto(file: Blob): Promise<void> {
    const image = await loadImageFile(file);
    const reference = {
      imageDataUrl: image.dataUrl,
      size: image.size,
      corners: defaultCorners(image.size),
      opacity: 0.62,
    };
    this.document.set(setReference(this.document.get(), reference));
    this.updateUi({
      activeCorner: 0,
      message: editorText().messages.photoLoaded(image.size[0], image.size[1]),
    });
  }

  removePhoto(): void {
    this.document.set(setReference(this.document.get(), undefined));
  }

  dragCorner(index: number, point: readonly [number, number]): void {
    this.updateUi({ activeCorner: index, cornerDraft: { index, point } });
  }

  commitCorner(): void {
    const draft = this.ui.get().cornerDraft;
    this.updateUi({ cornerDraft: undefined });
    if (draft) this.document.set(moveCorner(this.document.get(), draft.index, draft.point));
  }

  nudgeCorner(index: number, dx: number, dy: number): void {
    const corner = this.document.get().reference?.corners[index];
    if (corner)
      this.document.set(moveCorner(this.document.get(), index, [corner[0] + dx, corner[1] + dy]));
  }

  setOpacity(opacity: number, commit: boolean): void {
    if (!commit) return this.updateUi({ opacityDraft: opacity });
    this.updateUi({ opacityDraft: undefined });
    this.document.set(setReferenceOpacity(this.document.get(), opacity));
  }

  setSheet(sheet: Sheet): boolean {
    const next = setSheet(this.document.get(), sheet);
    if (!next) {
      this.updateUi({ message: editorText().messages.formatLocked });
      return false;
    }
    this.document.set(next);
    return true;
  }

  undo(): void {
    if (this.document.undo()) this.updateUi({ selection: [] });
  }

  redo(): void {
    if (this.document.redo()) this.updateUi({ selection: [] });
  }

  #scheduleDraft(): void {
    clearTimeout(this.#draftTimer);
    this.#draftTimer = setTimeout(() => void this.#writeDraft(), DRAFT_DELAY_MS);
  }

  /** Speichert sofort, z.B. bevor die Ansicht das Modell aus der Bibliothek liest. */
  async flush(): Promise<void> {
    clearTimeout(this.#draftTimer);
    await this.#writeDraft();
  }

  /** Speichert laufend in die Bibliothek; nach dem ersten Speichern zeigt die URL auf das Modell. */
  async #writeDraft(): Promise<void> {
    const savedAt = clock();
    const document = this.document.get();
    try {
      await saveModel({
        id: this.modelId,
        title: document.meta.title,
        updatedAt: new Date().toISOString(),
        text: this.serialize(),
      });
      this.updateUi({ savedAt });
      rememberInUrl(this.modelId);
    } catch (error) {
      this.updateUi({
        message: editorText().messages.notSaved(
          error instanceof Error ? error.message : String(error),
        ),
      });
    }
  }
}
