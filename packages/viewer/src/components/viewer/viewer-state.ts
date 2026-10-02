import type { Locale } from '@faltstudio/ui';
import { msg } from '../../i18n.js';

/**
 * Zustaende der Faltinteraktion (Handover: Bereit -> Ziehen -> Einrasten -> Fertig).
 * Ab M5 treibt das Ziehen an Kante oder Ecke den Winkel; bis dahin nur Vorfuehren.
 */
export const FOLD_STATES = ['ready', 'dragging', 'snapped', 'done'] as const;
export type FoldState = (typeof FOLD_STATES)[number];

/** Ab 90 % des Zielwinkels rastet die Faltung beim Loslassen ein. */
export const SNAP_RATIO = 0.9;

export const DEMO_DURATION_MS = 1400;

/** Woher die laufende Bewegung kommt: Finger, Zurueckfedern nach Loslassen oder Weiter/Vorfuehren. */
export type FoldMotion = 'drag' | 'release' | 'auto';

/**
 * Text des Status-Chips (Design R4): Bereit, Ziehen, Losgelassen, Eingerastet.
 *
 * @param state - Zustand der Faltinteraktion.
 * @param motion - Quelle der Bewegung, solange gefaltet wird.
 * @param angle - Aktueller Faltwinkel in Grad.
 * @param locale - Sprache des Widgets; ohne Wert die App-Sprache.
 * @returns Chip-Beschriftung in normaler Schreibung, Versalien setzt das CSS.
 */
export function chipLabel(
  state: FoldState,
  motion: FoldMotion,
  angle: number,
  locale?: Locale,
): string {
  const chip = msg(locale).chip;
  const degrees = `${angle.toFixed(0)}°`;
  if (state === 'snapped') return chip.snapped(degrees);
  if (state === 'done') return chip.done(degrees);
  if (state === 'ready') return chip.ready;
  return chip[motion](degrees);
}
