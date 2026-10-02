import { parseTutorial, preparePattern, type LineInput } from '@faltstudio/core';
import { localeTag } from '@faltstudio/ui';
import { common } from '../../i18n/common.js';
import { patternLines } from '../../state/pattern-view.js';

export interface CardData {
  readonly title: string;
  readonly steps: number;
  readonly sheet: string;
  readonly lines: readonly LineInput[];
  readonly readable: boolean;
}

const SHEET_NAMES: Readonly<Record<string, string>> = { '210x297': 'A4', '215.9x279.4': 'Letter' };

/** Kopfdaten und Mini-Muster fuer eine Karte; kaputte Dateien werden als solche markiert statt zu werfen. */
export function cardData(text: string, fallbackTitle: string): CardData {
  try {
    const tutorial = parseTutorial(text);
    const key = `${tutorial.sheet.width}x${tutorial.sheet.height}`;
    return {
      title: tutorial.meta.title || fallbackTitle,
      steps: tutorial.steps.length,
      sheet: SHEET_NAMES[key] ?? `${tutorial.sheet.width} × ${tutorial.sheet.height} mm`,
      lines: patternLines(preparePattern(tutorial)),
      readable: true,
    };
  } catch {
    return { title: fallbackTitle, steps: 0, sheet: '—', lines: [], readable: false };
  }
}

/** Tag und Monat in der aktuellen Sprache: „28.09.“ bzw. „28/09“. */
export const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString(localeTag(), { day: '2-digit', month: '2-digit' });

/**
 * Titel zum Anzeigen. Ohne eigenen Titel „Ohne Titel“ in der aktuellen
 * Sprache; deshalb nicht in den Kartendaten, die zwischengespeichert werden.
 */
export const displayTitle = (data: CardData): string => data.title || common().untitled;
