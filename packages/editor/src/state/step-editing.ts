import {
  applyKinds,
  collinearCreases,
  createTimeline,
  kindMismatches,
  removeFold,
  type KindMismatch,
  faceAt,
  foldSides,
  insertStep,
  memoizeLast,
  moveStep,
  previewStep,
  removeStep,
  setFold,
  updateStep,
  type CreaseId,
  type Fold,
  type FoldSide,
  type FoldState,
  type Step,
  type StepIssue,
  type Timeline,
  type Tutorial,
} from '@faltstudio/core';
import type { Editor } from './editor.js';
import { stepsText } from '../i18n/steps.js';

export type FoldDirection = 'valley' | 'mountain';

/** Dauer, in der die 3D-Vorschau einen Schritt abspielt. */
const PREVIEW_DURATION_MS = 1200;

/**
 * Schritt-Werkzeuge des Editors (M4): Auswahl der Segmente, bewegliche Seite,
 * Winkel, Reihenfolge. Liest und schreibt ueber den Editor-Store; die Timeline
 * wird je Dokument-Snapshot einmal berechnet.
 */
export class StepEditing {
  readonly #editor: Editor;
  #previewFrame: number | undefined;
  readonly #timeline = memoizeLast((document: Tutorial): Timeline =>
    createTimeline(this.#editor.pattern, document.steps),
  );

  constructor(editor: Editor) {
    this.#editor = editor;
  }

  get timeline(): Timeline {
    return this.#timeline(this.#editor.document.get());
  }

  get steps(): readonly Step[] {
    return this.#editor.document.get().steps;
  }

  get index(): number {
    return Math.min(this.#editor.ui.get().stepIndex, Math.max(0, this.steps.length - 1));
  }

  get step(): Step | undefined {
    return this.steps[this.index];
  }

  /** Index der bearbeiteten Faltung; zeigt hinter die letzte, wenn eine neue angelegt wird. */
  get foldIndex(): number {
    const count = this.step?.folds.length ?? 0;
    return Math.min(this.#editor.ui.get().foldIndex, count);
  }

  get fold(): Fold | undefined {
    return this.step?.folds[this.foldIndex];
  }

  /** Gespeicherte Linienarten, die nicht zum gefalteten Endzustand passen. Nur sinnvoll, wenn es Schritte gibt. */
  get kindMismatches(): readonly KindMismatch[] {
    return this.steps.length === 0 ? [] : kindMismatches(this.timeline);
  }

  get issues(): readonly StepIssue[] {
    return this.timeline.issues;
  }

  /** Zustand vor dem ausgewaehlten Schritt: darin werden Achsen und Vorschlaege bestimmt. */
  get before(): FoldState | undefined {
    return this.timeline.boundaries[this.index];
  }

  get suggestions(): readonly CreaseId[] {
    const fold = this.fold;
    const before = this.before;
    if (!fold || !before) return [];
    const found = fold.creaseIds.flatMap((id) =>
      collinearCreases(this.#editor.pattern, before, id),
    );
    return [...new Set(found)].filter((id) => !fold.creaseIds.includes(id));
  }

  get sides(): readonly FoldSide[] {
    const fold = this.fold;
    return fold ? foldSides(this.#editor.pattern, fold.creaseIds) : [];
  }

  get movingSide(): number {
    const fold = this.fold;
    if (!fold) return -1;
    const face = faceAt(this.#editor.pattern, fold.movingPoint);
    return this.sides.findIndex((side) => face !== undefined && side.faces.has(face.id));
  }

  /** Zustand am Ende des Schritts, mit dem Winkel am Drehregler, falls gerade gezogen wird. */
  get preview(): FoldState | undefined {
    const step = this.step;
    const draft = this.#editor.ui.get().angleDraft;
    if (!step) return this.timeline.boundaries.at(-1);
    const shown =
      draft === undefined
        ? step
        : {
            ...step,
            folds: step.folds.map((fold, index) =>
              index === this.foldIndex
                ? { ...fold, angle: Math.sign(fold.angle || 1) * draft }
                : fold,
            ),
          };
    const progress = draft === undefined ? this.#editor.ui.get().stepProgress : 1;
    return previewStep(this.timeline, this.index, shown, progress).state;
  }

  /** Vorschau auf einen Anteil setzen (Regler in der 3D-Ecke). */
  setPreviewProgress(progress: number): void {
    this.#stopPreview();
    this.#editor.updateUi({ stepProgress: Math.min(1, Math.max(0, progress)) });
  }

  /** Spielt den Schritt in 3D von 0 bis zum Zielzustand ab. */
  playPreview(): void {
    this.#stopPreview();
    if (typeof requestAnimationFrame !== 'function')
      return this.#editor.updateUi({ stepProgress: 1 });
    const start = performance.now();
    const tick = (now: number): void => {
      const ratio = Math.min(1, (now - start) / PREVIEW_DURATION_MS);
      this.#editor.updateUi({ stepProgress: 1 - (1 - ratio) ** 3 });
      if (ratio < 1) this.#previewFrame = requestAnimationFrame(tick);
    };
    this.#previewFrame = requestAnimationFrame(tick);
  }

  #stopPreview(): void {
    if (this.#previewFrame !== undefined && typeof cancelAnimationFrame === 'function')
      cancelAnimationFrame(this.#previewFrame);
    this.#previewFrame = undefined;
  }

  select(index: number): void {
    this.#stopPreview();
    this.#editor.updateUi({
      stepIndex: Math.min(Math.max(0, index), Math.max(0, this.steps.length - 1)),
      foldIndex: 0,
      stepProgress: 1,
    });
  }

  selectFold(index: number): void {
    this.#editor.updateUi({ foldIndex: Math.max(0, index) });
  }

  /** Neue, leere Faltung im selben Schritt; sie entsteht mit dem ersten Segment. */
  addFold(): void {
    this.#editor.updateUi({ foldIndex: this.step?.folds.length ?? 0 });
  }

  removeCurrentFold(): void {
    if (!this.fold) return;
    this.#editor.document.set(removeFold(this.#editor.document.get(), this.index, this.foldIndex));
    this.#editor.updateUi({ foldIndex: Math.max(0, this.foldIndex - 1) });
  }

  setSequential(sequential: boolean): void {
    this.#editor.document.set(updateStep(this.#editor.document.get(), this.index, { sequential }));
  }

  /** Uebernimmt die Linienarten aus dem Endzustand, fuer alle oder die genannten Creases. */
  adoptFinalKinds(ids?: readonly string[]): void {
    const kinds = new Map(
      this.kindMismatches
        .filter((entry) => entry.folded !== 'unfolded' && (!ids || ids.includes(entry.creaseId)))
        .map((entry) => [entry.creaseId, entry.folded as 'mountain' | 'valley']),
    );
    if (kinds.size > 0) this.#editor.document.set(applyKinds(this.#editor.document.get(), kinds));
  }

  add(): void {
    const { document, index } = insertStep(
      this.#editor.document.get(),
      this.steps.length === 0 ? 0 : this.index + 1,
      stepsText().steps.newStep,
    );
    this.#editor.document.set(document);
    this.#editor.updateUi({ stepIndex: index });
  }

  remove(): void {
    if (!this.step) return;
    this.#editor.document.set(removeStep(this.#editor.document.get(), this.index));
    this.select(this.index - 1);
  }

  move(from: number, to: number): void {
    this.#editor.document.set(moveStep(this.#editor.document.get(), from, to));
    this.select(to);
  }

  rename(title: string): void {
    this.#editor.document.set(updateStep(this.#editor.document.get(), this.index, { title }));
  }

  describe(text: string): void {
    this.#editor.document.set(updateStep(this.#editor.document.get(), this.index, { text }));
  }

  /** Nimmt ein Segment in die Faltung auf oder entfernt es. Die erste Auswahl legt die Faltung an. */
  toggleCrease(creaseId: CreaseId): void {
    const fold = this.fold;
    const creaseIds = fold?.creaseIds.includes(creaseId)
      ? fold.creaseIds.filter((id) => id !== creaseId)
      : [...(fold?.creaseIds ?? []), creaseId];
    this.#writeFold(creaseIds, fold);
  }

  acceptSuggestions(): void {
    const fold = this.fold;
    if (fold) this.#writeFold([...fold.creaseIds, ...this.suggestions], fold);
  }

  chooseSide(index: number): void {
    const fold = this.fold;
    const side = this.sides[index];
    if (fold && side) this.#commit({ ...fold, movingPoint: side.point });
  }

  dragAngle(degrees: number): void {
    this.#editor.updateUi({ angleDraft: degrees });
  }

  setAngle(degrees: number): void {
    const fold = this.fold;
    this.#editor.updateUi({ angleDraft: undefined });
    if (fold)
      this.#commit({
        ...fold,
        angle: Math.sign(fold.angle || 1) * Math.min(180, Math.max(0, degrees)),
      });
  }

  setDirection(direction: FoldDirection): void {
    const fold = this.fold;
    if (!fold) return;
    const magnitude = Math.abs(fold.angle);
    this.#commit({ ...fold, angle: direction === 'valley' ? magnitude : -magnitude });
  }

  #writeFold(creaseIds: readonly CreaseId[], fold: Fold | undefined): void {
    if (!this.step) this.add();
    if (creaseIds.length === 0) return this.#editor.document.set(this.#withoutFold());
    const sides = foldSides(this.#editor.pattern, creaseIds);
    const movingPoint = fold?.movingPoint ?? (sides[1] ?? sides[0])?.point ?? [0, 0];
    this.#commit({ creaseIds, movingPoint, angle: fold?.angle ?? 180 });
  }

  #withoutFold(): Tutorial {
    return removeFold(this.#editor.document.get(), this.index, this.foldIndex);
  }

  /** Jede Aenderung an der Faltung wird sofort als Bewegung gezeigt. */
  #commit(fold: Fold): void {
    this.#editor.document.set(
      setFold(this.#editor.document.get(), this.index, this.foldIndex, fold),
    );
    this.playPreview();
  }
}
