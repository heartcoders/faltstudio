/** Geometrie des Winkelmessers aus dem Design (viewBox 240 x 150). */
export const DIAL = { cx: 120, cy: 128, radius: 100, width: 240, height: 150 } as const;

export const SNAP_ANGLES = [90, 180] as const;
export const SNAP_TOLERANCE = 3;

export interface Point {
  readonly x: number;
  readonly y: number;
}

/** Punkt auf dem Bogen: 0 Grad links, 180 Grad rechts, 90 Grad oben. */
export function pointAt(degrees: number, radius: number = DIAL.radius): Point {
  const theta = Math.PI - (degrees * Math.PI) / 180;
  return { x: DIAL.cx + radius * Math.cos(theta), y: DIAL.cy - radius * Math.sin(theta) };
}

/** Winkel eines Zeigers relativ zum Mittelpunkt, auf 0 bis 180 begrenzt. */
export function angleFrom(point: Point): number {
  const degrees = (Math.atan2(DIAL.cy - point.y, point.x - DIAL.cx) * 180) / Math.PI;
  const fromLeft = 180 - degrees;
  if (fromLeft > 270) return 0;
  return Math.min(180, Math.max(0, fromLeft));
}

/** Rastet bei 90 und 180 Grad ein, wenn der Wert hoechstens 3 Grad daneben liegt. */
export function snapAngle(degrees: number): number {
  const target = SNAP_ANGLES.find((snap) => Math.abs(snap - degrees) <= SNAP_TOLERANCE);
  return target ?? degrees;
}

export function roundAngle(degrees: number): number {
  return Math.round(degrees * 10) / 10;
}
