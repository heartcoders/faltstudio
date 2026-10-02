import type { Vec2 } from '@faltstudio/core';

export const POINTER_PHASES = ['move', 'down', 'leave'] as const;
export type PointerPhase = (typeof POINTER_PHASES)[number];

/** Zeigerereignis der Zeichenflaeche, bereits in Modellkoordinaten (mm). */
export interface CanvasPointer {
  readonly phase: PointerPhase;
  readonly point: Vec2;
  readonly shift: boolean;
  /** Alt/Option: im Auswahlwerkzeug die ganze Linie statt nur des Stuecks. */
  readonly alt: boolean;
  /** Wie viele mm ein Bildschirmpixel gerade misst; fuer Einrast- und Trefferradius. */
  readonly mmPerPixel: number;
  /** Beruehrung: Punkt liegt ueber dem Finger, `down` kommt erst beim Loslassen. */
  readonly touch?: boolean;
}

/** Einrast- und Trefferradius in Bildschirmpixeln, unabhaengig vom Zoom. */
export const HIT_RADIUS_PX = 10;

/** Fingerbreite: auf Beruehrung groesser, damit Linien treffbar bleiben. */
export const TOUCH_HIT_RADIUS_PX = 22;

export const hitRadius = (pointer: CanvasPointer): number =>
  (pointer.touch ? TOUCH_HIT_RADIUS_PX : HIT_RADIUS_PX) * pointer.mmPerPixel;
