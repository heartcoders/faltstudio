import { tokenVar } from './tokens.js';
import { tokens, type TokenName } from '../tokens/tokens.js';

/**
 * Normalisiert eine beliebige CSS-Farbe in die Hex-Form, die three.js versteht.
 * Canvas 2D liefert fuer jede gueltige Farbe ohne Alpha `#rrggbb` zurueck.
 */
export function toHexColor(cssColor: string): string {
  const context = document.createElement('canvas').getContext('2d');
  if (!context) return '#000000';
  context.fillStyle = cssColor;
  return context.fillStyle;
}

/**
 * Farbtoken fuer Stellen ausserhalb von CSS (three.js-Materialien). three.js
 * versteht weder var() noch moderne Farbsyntax; gelesen wird der berechnete
 * Wert am Element, damit Theme-Overrides greifen.
 */
export function readTokenColor(element: Element, name: TokenName): string {
  const value = getComputedStyle(element).getPropertyValue(tokenVar(name)).trim();
  return toHexColor(value || tokens[name]);
}
