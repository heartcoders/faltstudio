/**
 * Das geteilte Varianten-Vokabular:
 *   variant — Form / Prominenz, pro Komponente definiert
 *   tone    — semantische Bedeutung, uebergreifend identisch
 *   size    — Skala, uebergreifend identisch
 */
export const TONES = ['auto', 'neutral', 'critical'] as const;
export const SIZES = ['small', 'base', 'large'] as const;

export type Tone = (typeof TONES)[number];
export type Size = (typeof SIZES)[number];
