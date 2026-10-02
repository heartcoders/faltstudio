import type { Step } from '../model/index.js';
import { applyFold } from './apply-fold.js';
import type { FoldError } from './fold-error.js';
import type { FoldPattern } from './pattern.js';
import { flatState, type FoldState } from './state.js';

export interface StepIssue {
  readonly stepIndex: number;
  readonly foldIndex: number;
  readonly error: FoldError;
}

/**
 * Faltablauf eines Tutorials. Die Endzustaende aller Schritte werden einmal
 * berechnet; `stateAt` interpoliert nur innerhalb des angefragten Schritts.
 */
export interface Timeline {
  readonly pattern: FoldPattern;
  readonly steps: readonly Step[];
  /** `boundaries[i]` ist der Zustand vor Schritt i; der letzte Eintrag der Endzustand. */
  readonly boundaries: readonly FoldState[];
  readonly issues: readonly StepIssue[];
}

function foldProgress(step: Step, foldIndex: number, progress: number): number {
  if (!step.sequential) return progress;
  return Math.min(1, Math.max(0, progress * step.folds.length - foldIndex));
}

interface StepRun {
  readonly state: FoldState;
  readonly issues: readonly StepIssue[];
}

function runStep(
  pattern: FoldPattern,
  start: FoldState,
  step: Step,
  stepIndex: number,
  progress: number,
): StepRun {
  let state = start;
  const issues: StepIssue[] = [];
  step.folds.forEach((fold, foldIndex) => {
    const result = applyFold(pattern, state, fold, foldProgress(step, foldIndex, progress));
    if (result.ok) state = result.value.state;
    else issues.push({ stepIndex, foldIndex, error: result.error });
  });
  return { state, issues };
}

export function createTimeline(pattern: FoldPattern, steps: readonly Step[]): Timeline {
  const boundaries: FoldState[] = [flatState(pattern)];
  const issues: StepIssue[] = [];
  steps.forEach((step, stepIndex) => {
    const run = runStep(pattern, boundaries[stepIndex] as FoldState, step, stepIndex, 1);
    boundaries.push(run.state);
    issues.push(...run.issues);
  });
  return { pattern, steps, boundaries, issues };
}

/**
 * Zustand waehrend Schritt `stepIndex` bei Fortschritt `progress` (0..1).
 * `stepIndex` gleich Anzahl der Schritte liefert den Endzustand.
 */
export function stateAt(timeline: Timeline, stepIndex: number, progress: number): FoldState {
  const index = Math.min(timeline.steps.length, Math.max(0, stepIndex));
  const start = timeline.boundaries[index] as FoldState;
  const step = timeline.steps[index];
  if (!step || progress <= 0) return start;
  if (progress >= 1) return timeline.boundaries[index + 1] as FoldState;
  return runStep(timeline.pattern, start, step, index, progress).state;
}

/**
 * Vorschau eines geaenderten Schritts, ohne die Timeline neu aufzubauen: der
 * Schritt wird auf den Zustand vor `stepIndex` angewendet. Fuer Drehregler und
 * Segmentauswahl im Editor, bevor die Aenderung ins Dokument geht.
 */
export function previewStep(
  timeline: Timeline,
  stepIndex: number,
  step: Step,
  progress = 1,
): { readonly state: FoldState; readonly issues: readonly StepIssue[] } {
  const index = Math.min(timeline.steps.length, Math.max(0, stepIndex));
  return runStep(timeline.pattern, timeline.boundaries[index] as FoldState, step, index, progress);
}
