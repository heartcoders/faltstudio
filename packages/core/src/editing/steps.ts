import type { Fold, Step, StepId, Tutorial } from '../model/index.js';

const clampIndex = (index: number, length: number): number => Math.min(Math.max(0, index), length);

function nextStepId(document: Tutorial): StepId {
  const taken = new Set(document.steps.map((step) => step.id));
  let index = document.steps.length + 1;
  while (taken.has(`s${index}`)) index += 1;
  return `s${index}`;
}

const withSteps = (document: Tutorial, steps: readonly Step[]): Tutorial => ({
  ...document,
  steps,
});

/** Fuegt einen leeren Schritt an `index` ein und liefert Dokument und neuen Index. */
export function insertStep(
  document: Tutorial,
  index: number,
  title = 'Neuer Schritt',
): { readonly document: Tutorial; readonly index: number } {
  const position = clampIndex(index, document.steps.length);
  const step: Step = { id: nextStepId(document), title, text: '', folds: [] };
  const steps = [...document.steps.slice(0, position), step, ...document.steps.slice(position)];
  return { document: withSteps(document, steps), index: position };
}

export function removeStep(document: Tutorial, index: number): Tutorial {
  if (!document.steps[index]) return document;
  return withSteps(
    document,
    document.steps.filter((_, position) => position !== index),
  );
}

export function moveStep(document: Tutorial, from: number, to: number): Tutorial {
  const step = document.steps[from];
  const target = clampIndex(to, document.steps.length - 1);
  if (!step || from === target) return document;
  const rest = document.steps.filter((_, position) => position !== from);
  return withSteps(document, [...rest.slice(0, target), step, ...rest.slice(target)]);
}

export function updateStep(
  document: Tutorial,
  index: number,
  patch: Partial<Pick<Step, 'title' | 'text' | 'sequential'>>,
): Tutorial {
  const step = document.steps[index];
  if (!step) return document;
  const changed = Object.entries(patch).some(([key, value]) => step[key as keyof Step] !== value);
  if (!changed) return document;
  return withSteps(
    document,
    document.steps.map((candidate, position) =>
      position === index ? { ...candidate, ...patch } : candidate,
    ),
  );
}

/** Ersetzt die Faltung `foldIndex` (oder haengt sie an, wenn es sie noch nicht gibt). */
export function setFold(
  document: Tutorial,
  stepIndex: number,
  foldIndex: number,
  fold: Fold,
): Tutorial {
  const step = document.steps[stepIndex];
  if (!step) return document;
  const folds =
    foldIndex < step.folds.length
      ? step.folds.map((candidate, index) => (index === foldIndex ? fold : candidate))
      : [...step.folds, fold];
  return withSteps(
    document,
    document.steps.map((candidate, index) =>
      index === stepIndex ? { ...candidate, folds } : candidate,
    ),
  );
}

export function removeFold(document: Tutorial, stepIndex: number, foldIndex: number): Tutorial {
  const step = document.steps[stepIndex];
  if (!step?.folds[foldIndex]) return document;
  const folds = step.folds.filter((_, index) => index !== foldIndex);
  return withSteps(
    document,
    document.steps.map((candidate, index) =>
      index === stepIndex ? { ...candidate, folds } : candidate,
    ),
  );
}
