import { common } from '../i18n/common.js';

/** „1 Schritt“, „8 Schritte“ bzw. „1 step“, „8 steps“ in der aktuellen Sprache. */
export const stepCount = (count: number): string => common().steps(count);
