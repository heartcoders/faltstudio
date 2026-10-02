import type { CreaseId } from '@faltstudio/core';
import { common } from '../i18n/common.js';
import { foldErrorText, patternIssueText, stepsText } from '../i18n/steps.js';
import type { Editor } from './editor.js';

export type IssueTarget =
  | { readonly kind: 'lines'; readonly creaseIds: readonly CreaseId[] }
  | { readonly kind: 'step'; readonly stepIndex: number };

/** Ein Befund, egal woher: Muster, Linienart oder Schritt. Fuer den Zaehler im Kopf und die Liste. */
export interface EditorIssue {
  readonly key: string;
  readonly severity: 'error' | 'warning';
  readonly title: string;
  readonly message: string;
  readonly target?: IssueTarget;
  /** Direkte Korrektur, falls es eine gibt (z.B. Linienart uebernehmen). */
  readonly fix?: { readonly label: string; readonly run: () => void };
}

function patternIssues(editor: Editor): readonly EditorIssue[] {
  return editor.issues.map((issue, index) => ({
    key: `pattern-${index}`,
    severity: issue.severity,
    ...patternIssueText(issue),
    ...(issue.creaseIds ? { target: { kind: 'lines' as const, creaseIds: issue.creaseIds } } : {}),
  }));
}

function kindIssues(editor: Editor): readonly EditorIssue[] {
  return editor.steps.kindMismatches.map((mismatch) => ({
    key: `kind-${mismatch.creaseId}`,
    severity: 'warning' as const,
    title: stepsText().issues.kindTitle(mismatch.creaseId),
    message: stepsText().issues.kindMessage(
      common().kinds[mismatch.stored],
      common().kinds[mismatch.folded],
    ),
    target: { kind: 'lines' as const, creaseIds: [mismatch.creaseId] },
    ...(mismatch.folded === 'unfolded'
      ? {}
      : {
          fix: {
            label: common().adopt,
            run: () => editor.steps.adoptFinalKinds([mismatch.creaseId]),
          },
        }),
  }));
}

function stepIssues(editor: Editor): readonly EditorIssue[] {
  return editor.steps.issues.map((issue) => ({
    key: `step-${issue.stepIndex}-${issue.foldIndex}`,
    severity: 'error' as const,
    title: common().step(String(issue.stepIndex + 1).padStart(2, '0')),
    message: foldErrorText(issue.error),
    target: { kind: 'step' as const, stepIndex: issue.stepIndex },
  }));
}

/** Alle Befunde des Dokuments, Fehler zuerst. */
export function collectIssues(editor: Editor): readonly EditorIssue[] {
  const all = [...patternIssues(editor), ...stepIssues(editor), ...kindIssues(editor)];
  return [
    ...all.filter((issue) => issue.severity === 'error'),
    ...all.filter((issue) => issue.severity === 'warning'),
  ];
}
