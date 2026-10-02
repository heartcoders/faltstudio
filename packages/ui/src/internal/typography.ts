import { css } from 'lit';
import { t } from './tokens.js';

/** Versal-Label mit Laufweite: Panel-Koepfe, Buttons, Meta-Zeilen. */
export const labelText = css`
  font-size: ${t('text-label-size')};
  letter-spacing: ${t('track-label')};
  text-transform: uppercase;
`;

/** Kleinste Stufe fuer Nummern, Einheiten und Plan-Metadaten. */
export const microText = css`
  font-size: ${t('text-micro')};
  letter-spacing: ${t('track-label')};
  text-transform: uppercase;
  color: ${t('text-label')};
`;

/** Gestrichelter Fokusring aus dem Design (C01 FOKUS). */
export const focusRing = css`
  outline: ${t('line-2')} dashed ${t('border-focus')};
  outline-offset: 3px;
`;

/** Titel in Space Grotesk (Redesign „Tisch & Papier“). */
export const displayText = css`
  font-family: ${t('font-display')};
  font-weight: 500;
  letter-spacing: -0.02em;
  line-height: 1;
`;

/**
 * Grosse Umriss-Ziffer, die zeigt, wo man ist (Modell 03, Schritt 03). Nur
 * Kontur, keine Fuellung; die Groesse setzt der Aufrufer per `font-size`.
 */
export const outlineIndex = css`
  font-family: ${t('font-display')};
  font-weight: 300;
  line-height: 0.78;
  letter-spacing: -0.06em;
  color: transparent;
  -webkit-text-stroke: ${t('index-stroke')} ${t('text-secondary')};
`;

/** Gefluesterter Hintergrund-Schriftzug auf dem Tisch (FALTEN, FALTSTUDIO). */
export const watermarkText = css`
  font-family: ${t('font-display')};
  font-weight: 700;
  letter-spacing: -0.05em;
  line-height: 1;
  white-space: nowrap;
  color: transparent;
  -webkit-text-stroke: ${t('line-1')} ${t('table-watermark')};
  pointer-events: none;
  user-select: none;
`;
