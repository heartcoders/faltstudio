import { cross, sub, type Vec2 } from '../math/index.js';

export type Polygon = readonly Vec2[];

/** Vorzeichenbehaftete Flaeche (Shoelace): > 0 bei Umlauf gegen den Uhrzeigersinn. */
export function signedArea(polygon: Polygon): number {
  let sum = 0;
  for (let index = 0; index < polygon.length; index++) {
    const current = polygon[index] as Vec2;
    const next = polygon[(index + 1) % polygon.length] as Vec2;
    sum += cross(current, next);
  }
  return sum / 2;
}

/** Schwerpunkt der Flaeche; fuer Beschriftung und Lagen-Hinweise. */
export function centroid(polygon: Polygon): Vec2 {
  const area = signedArea(polygon);
  let cx = 0;
  let cy = 0;
  for (let index = 0; index < polygon.length; index++) {
    const [x0, y0] = polygon[index] as Vec2;
    const [x1, y1] = polygon[(index + 1) % polygon.length] as Vec2;
    const factor = x0 * y1 - x1 * y0;
    cx += (x0 + x1) * factor;
    cy += (y0 + y1) * factor;
  }
  return [cx / (6 * area), cy / (6 * area)];
}

/** Punkt-in-Polygon per Strahlverfahren. Punkte auf dem Rand sind unbestimmt. */
export function containsPoint(polygon: Polygon, point: Vec2): boolean {
  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
    const [xi, yi] = polygon[index] as Vec2;
    const [xj, yj] = polygon[previous] as Vec2;
    const crosses = yi > point[1] !== yj > point[1];
    if (crosses && point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Wendung an b auf dem Weg a -> b -> c: > 0 links, < 0 rechts, 0 gerade. */
export const turn = (a: Vec2, b: Vec2, c: Vec2): number => cross(sub(b, a), sub(c, b));
