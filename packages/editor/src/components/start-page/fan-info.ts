import { startText } from '../../i18n/start.js';
import { stepCount } from '../../state/step-count.js';
import { displayTitle, formatDate, type CardData } from './model-card-data.js';
import type { ModelStatus } from './model-status.js';

/** Was ueber dem Faecher zum gewaehlten Blatt steht (Design R1/D1). */
export interface FanInfo {
  readonly index: string;
  readonly kicker: string;
  readonly title: string;
  readonly meta: string;
}

/** Zweistellige Nummer, wie die Umriss-Ziffer sie zeigt. */
export const pad = (value: number): string => String(value).padStart(2, '0');

/**
 * Kurzer Pruefstand fuer die Kopfzeile: „1 Fehler“, „Entwurf“, „Geprüft“.
 *
 * @param status - Pruefstand des Modells.
 * @returns Wort fuer die Kopfzeile, Grossschreibung uebernimmt das CSS.
 */
export const statusWord = (status: ModelStatus): string =>
  status.kind === 'error'
    ? startText().status.errors(status.count)
    : startText().status[status.kind];

interface ModelInfoInput {
  readonly position: number;
  readonly total: number;
  readonly data: CardData;
  readonly status: ModelStatus;
  readonly updatedAt: string;
}

/**
 * Kopfzeilen zu einem gespeicherten Modell.
 *
 * @param input - Position im Faecher, Gesamtzahl, Kartendaten, Pruefstand, Aenderungsdatum.
 * @returns Nummer, Kicker, Titel und Metazeile.
 */
export function modelInfo({ position, total, data, status, updatedAt }: ModelInfoInput): FanInfo {
  const text = startText().info;
  const meta = data.readable
    ? `${stepCount(data.steps)} · ${data.sheet} · ${formatDate(updatedAt)}`
    : `${text.damaged} · ${formatDate(updatedAt)}`;
  return {
    index: pad(position + 1),
    kicker: text.kicker(pad(position + 1), pad(total), statusWord(status)),
    title: displayTitle(data),
    meta,
  };
}

/**
 * Kopfzeilen zum leeren Blatt am Ende des Faechers.
 *
 * @param total - Anzahl der gespeicherten Modelle.
 * @returns Nummer, Kicker, Titel und Metazeile fuer „Neues Blatt“.
 */
export const newSheetInfo = (total: number): FanInfo => ({
  index: pad(total + 1),
  kicker: startText().info.newKicker,
  title: startText().newModel,
  meta: startText().info.newMeta,
});

interface ExampleInfoInput {
  readonly position: number;
  readonly fanPosition: number;
  readonly total: number;
  readonly data: CardData;
}

/**
 * Kopfzeilen zu einem mitgelieferten Beispiel; es oeffnet als eigene Kopie.
 *
 * @param input - Position unter den Beispielen und im Faecher, Anzahl Beispiele, Kartendaten.
 * @returns Nummer, Kicker, Titel und Metazeile.
 */
export function exampleInfo({ position, fanPosition, total, data }: ExampleInfoInput): FanInfo {
  return {
    index: pad(fanPosition + 1),
    kicker: startText().info.exampleKicker(pad(position + 1), pad(total)),
    title: displayTitle(data),
    meta: `${stepCount(data.steps)} · ${data.sheet}`,
  };
}
