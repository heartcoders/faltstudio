import type { Vec2 } from '../math/index.js';
import { signedArea, turn, type Polygon } from './polygon.js';
import { AREA_EPSILON } from './tolerance.js';

/** Drei Indizes in das Polygon der Flaeche, gegen den Uhrzeigersinn. */
export type Triangle = readonly [number, number, number];

const at = (polygon: Polygon, index: number): Vec2 => polygon[index] as Vec2;

function isInsideTriangle(point: Vec2, a: Vec2, b: Vec2, c: Vec2): boolean {
  return (
    turn(a, b, point) >= -AREA_EPSILON &&
    turn(b, c, point) >= -AREA_EPSILON &&
    turn(c, a, point) >= -AREA_EPSILON
  );
}

function isEar(polygon: Polygon, ring: readonly number[], position: number): boolean {
  const count = ring.length;
  const [ia, ib, ic] = [
    ring[(position - 1 + count) % count],
    ring[position],
    ring[(position + 1) % count],
  ] as [number, number, number];
  const [a, b, c] = [at(polygon, ia), at(polygon, ib), at(polygon, ic)];
  if (turn(a, b, c) <= AREA_EPSILON) return false;
  return ring.every(
    (index) =>
      index === ia ||
      index === ib ||
      index === ic ||
      !isInsideTriangle(at(polygon, index), a, b, c),
  );
}

/** Vertices auf einer geraden Kante tragen keine Flaeche und blockieren sonst das Ohrenschneiden. */
function withoutStraightVertices(polygon: Polygon): number[] {
  const all = polygon.map((_, index) => index);
  return all.filter((index) => {
    const previous = at(polygon, (index - 1 + polygon.length) % polygon.length);
    const next = at(polygon, (index + 1) % polygon.length);
    return Math.abs(turn(previous, at(polygon, index), next)) > AREA_EPSILON;
  });
}

function clipEar(polygon: Polygon, ring: number[]): Triangle | undefined {
  const position = ring.findIndex((_, candidate) => isEar(polygon, ring, candidate));
  if (position < 0) return undefined;
  const count = ring.length;
  const triangle: Triangle = [
    ring[(position - 1 + count) % count],
    ring[position],
    ring[(position + 1) % count],
  ] as [number, number, number];
  ring.splice(position, 1);
  return triangle;
}

/**
 * Ear Clipping fuer einfache Polygone gegen den Uhrzeigersinn. Liefert Indizes
 * in das Originalpolygon. Wirft, wenn das Polygon nicht einfach ist.
 */
export function triangulate(polygon: Polygon): readonly Triangle[] {
  if (signedArea(polygon) <= 0) throw new Error('Polygon muss gegen den Uhrzeigersinn laufen.');
  const ring = withoutStraightVertices(polygon);
  const triangles: Triangle[] = [];
  while (ring.length > 3) {
    const ear = clipEar(polygon, ring);
    if (!ear) throw new Error('Polygon ist nicht einfach, kein Ohr gefunden.');
    triangles.push(ear);
  }
  if (ring.length === 3) triangles.push(ring as unknown as Triangle);
  return triangles;
}
