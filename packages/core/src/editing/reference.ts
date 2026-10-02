import type { Reference, Sheet, Tutorial } from '../model/index.js';
import type { Vec2 } from '../math/index.js';
import type { Quad } from '../geometry/index.js';
import { createDocument } from './document.js';

/** Startgriffe fuer ein neues Foto: 10 % vom Rand eingerueckt. */
export function defaultCorners([width, height]: readonly [number, number]): Quad {
  const [x0, y0, x1, y1] = [width * 0.1, height * 0.1, width * 0.9, height * 0.9];
  return [
    [x0, y0],
    [x1, y0],
    [x1, y1],
    [x0, y1],
  ];
}

export function setReference(document: Tutorial, reference: Reference | undefined): Tutorial {
  if (reference === undefined) {
    const rest = { ...document };
    delete rest.reference;
    return rest;
  }
  return { ...document, reference };
}

export function moveCorner(document: Tutorial, index: number, point: Vec2): Tutorial {
  const reference = document.reference;
  if (!reference || index < 0 || index > 3) return document;
  const corners = reference.corners.map((corner, position) =>
    position === index ? point : corner,
  ) as unknown as Reference['corners'];
  return { ...document, reference: { ...reference, corners } };
}

export function setReferenceOpacity(document: Tutorial, opacity: number): Tutorial {
  const reference = document.reference;
  if (!reference) return document;
  const clamped = Math.min(1, Math.max(0, opacity));
  return clamped === reference.opacity
    ? document
    : { ...document, reference: { ...reference, opacity: clamped } };
}

/**
 * Wechselt das Blattformat. Nur solange ausser dem Rand noch nichts gezeichnet
 * ist und es keine Schritte gibt; sonst passten Linien und Schritte nicht mehr.
 */
export function setSheet(document: Tutorial, sheet: Sheet): Tutorial | undefined {
  const drawn =
    document.creases.some((crease) => crease.kind !== 'border') || document.steps.length > 0;
  if (drawn) return undefined;
  if (document.sheet.width === sheet.width && document.sheet.height === sheet.height)
    return document;
  const fresh = createDocument(sheet, document.meta.title, document.meta.date);
  return {
    ...fresh,
    meta: document.meta,
    ...(document.reference ? { reference: document.reference } : {}),
  };
}
