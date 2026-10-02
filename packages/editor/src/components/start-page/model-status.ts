import { parseTutorial } from '@faltstudio/core';
import { Editor } from '../../state/editor.js';
import { collectIssues } from '../../state/issues.js';
import { startText } from '../../i18n/start.js';

/** Pruefstand eines Modells fuer das Etikett auf der Karte (Design H1). */
export type ModelStatus =
  | { readonly kind: 'error'; readonly count: number }
  | { readonly kind: 'draft' }
  | { readonly kind: 'checked' };

/**
 * Prueft ein gespeichertes Modell mit denselben Befunden wie der Editor.
 * Fehler zaehlen, Warnungen oder fehlende Schritte gelten als Entwurf.
 *
 * @param text - Tutorial-Datei als Text.
 * @returns Fehler mit Anzahl, Entwurf oder geprueft; eine unlesbare Datei ist ein Fehler.
 */
export function modelStatus(text: string): ModelStatus {
  try {
    const tutorial = parseTutorial(text);
    const issues = collectIssues(new Editor(tutorial));
    const errors = issues.filter((issue) => issue.severity === 'error').length;
    if (errors > 0) return { kind: 'error', count: errors };
    if (issues.length > 0 || tutorial.steps.length === 0) return { kind: 'draft' };
    return { kind: 'checked' };
  } catch {
    return { kind: 'error', count: 1 };
  }
}

/** Etikett des Pruefstands in der aktuellen Sprache: „× 1 Fehler“, „Entwurf“, „Geprüft“. */
export const statusLabel = (status: ModelStatus): string =>
  status.kind === 'error'
    ? startText().status.errorLabel(status.count)
    : startText().status[status.kind];
