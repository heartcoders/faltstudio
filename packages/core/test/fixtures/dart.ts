import { SHEET_A4, sheetBorder, type LineInput } from '../../src/index.js';

/**
 * Klassischer Pfeil auf A4, Schritte 1 bis 6, hergeleitet statt abgezeichnet.
 * Nase N = (105, 297). Schritt 4 faltet durch zwei Lagen: in der Grundlage
 * liegt L5 bis (210, 43.49), in der umgeklappten Ecke aus Schritt 2 liegt das
 * an L3 gespiegelte Segment L5' bis (210, 253.51). Das Design rundet auf 43.5
 * und 253.5; das laesst nach Schritt 6 Kanten 0,003 mm ueberstehen. Weil die Ecke umgedreht ist,
 * wird aus dem Tal dort ein Berg. Links spiegelbildlich. Die Fluegel (Schritt
 * 7, 8) entstehen in M2 aus dem gefalteten Zustand.
 */
const NOSE = [105, 297] as const;
const HALF_WIDTH = SHEET_A4.width / 2;
const TAN_22_5 = Math.tan(Math.PI / 8);

/** Schraegkante auf die Mitte: Winkelhalbierende 22,5 Grad zur Mittellinie, trifft den Rand bei y = 297 - 105 / tan 22,5. */
const EDGE_Y = NOSE[1] - HALF_WIDTH / TAN_22_5;
/** Gespiegeltes Segment in der umgeklappten Ecke, trifft den Rand bei y = 297 - 105 * tan 22,5. */
const FLAP_Y = NOSE[1] - HALF_WIDTH * TAN_22_5;

export const dartThroughStepSix: readonly LineInput[] = [
  ...sheetBorder(SHEET_A4),
  { id: 'L1', a: [105, 0], b: NOSE, kind: 'mountain' },
  { id: 'L2', a: NOSE, b: [0, 192], kind: 'valley' },
  { id: 'L3', a: NOSE, b: [210, 192], kind: 'valley' },
  { id: 'L4', a: NOSE, b: [0, EDGE_Y], kind: 'valley' },
  { id: 'L5', a: NOSE, b: [210, EDGE_Y], kind: 'valley' },
  { id: "L4'", a: NOSE, b: [0, FLAP_Y], kind: 'mountain' },
  { id: "L5'", a: NOSE, b: [210, FLAP_Y], kind: 'mountain' },
];
