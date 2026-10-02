import {
  createTimeline,
  flatState,
  parseTutorial,
  preparePattern,
  restPose,
} from '@faltstudio/core';
import type { TurntableModel } from '@faltstudio/core/three';

/**
 * Was die Uebersicht zeigt: den fertig gefalteten Flieger in Ruhelage. Ohne
 * Schritte das flache Blatt; laesst sich ein Schritt nicht falten, der letzte
 * gueltige Zustand.
 *
 * @param text - Tutorial-Datei als Text.
 * @returns Muster, Zustand und Ruhelage; undefined, wenn die Datei unlesbar ist.
 */
export function turntableModel(text: string): TurntableModel | undefined {
  try {
    const tutorial = parseTutorial(text);
    const pattern = preparePattern(tutorial);
    const finished = createTimeline(pattern, tutorial.steps).boundaries.at(-1);
    if (!finished || tutorial.steps.length === 0) return { pattern, state: flatState(pattern) };
    return { pattern, state: finished, pose: restPose(pattern, finished) };
  } catch {
    return undefined;
  }
}
