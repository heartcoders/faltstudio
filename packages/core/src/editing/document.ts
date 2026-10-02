import type { CreaseId, CreaseKind, Sheet, Tutorial } from '../model/index.js';
import { FORMAT_VERSION } from '../model/index.js';
import {
  linesToGraph,
  planarize,
  sheetBorder,
  type CreaseGraph,
  type LineInput,
} from '../geometry/index.js';
import { mergeCollinear } from './merge.js';
import { remapSteps } from './remap.js';

function withGraph(document: Tutorial, graph: CreaseGraph): Tutorial {
  return {
    ...document,
    vertices: graph.vertices,
    creases: graph.creases,
    steps: remapSteps(document, graph, document.steps),
  };
}

/** Leeres Blatt mit Randlinien. */
export function createDocument(
  sheet: Sheet,
  title = 'Neues Muster',
  date = new Date().toISOString().slice(0, 10),
): Tutorial {
  const graph = planarize(linesToGraph(sheetBorder(sheet)));
  return {
    formatVersion: FORMAT_VERSION,
    meta: { title, author: '', date },
    sheet,
    vertices: graph.vertices,
    creases: graph.creases,
    steps: [],
  };
}

/** Fuegt Linien ein, schneidet neu und schreibt die Schritt-Verweise um. */
export function addLines(document: Tutorial, lines: readonly LineInput[]): Tutorial {
  const merged = linesToGraph(lines);
  const graph = planarize({
    vertices: [...document.vertices, ...merged.vertices],
    creases: [...document.creases, ...merged.creases],
  });
  return withGraph(document, graph);
}

/** Entfernt Creases (Randlinien bleiben) und fuehrt geteilte Reste wieder zusammen. */
export function removeCreases(document: Tutorial, ids: readonly CreaseId[]): Tutorial {
  const doomed = new Set(ids);
  const creases = document.creases.filter(
    (crease) => crease.kind === 'border' || !doomed.has(crease.id),
  );
  if (creases.length === document.creases.length) return document;
  return withGraph(document, mergeCollinear({ vertices: document.vertices, creases }));
}

export function setCreaseKind(
  document: Tutorial,
  ids: readonly CreaseId[],
  kind: Exclude<CreaseKind, 'border'>,
): Tutorial {
  const targets = new Set(ids);
  let changed = false;
  const creases = document.creases.map((crease) => {
    if (!targets.has(crease.id) || crease.kind === 'border' || crease.kind === kind) return crease;
    changed = true;
    return { ...crease, kind };
  });
  return changed ? { ...document, creases } : document;
}

/** Freie ID fuer eine neue Linie: L1, L2, ... ohne Kollision mit bestehenden Basen. */
export function nextLineId(document: Tutorial, prefix = 'L'): string {
  const taken = new Set(document.creases.map((crease) => crease.id.replace(/\.\d+$/, '')));
  let index = 1;
  while (taken.has(`${prefix}${index}`)) index += 1;
  return `${prefix}${index}`;
}

/** Uebernimmt die Linienarten aus dem Endzustand der Schritte (Handover: Crease speichert den Endzustand). */
export function applyKinds(
  document: Tutorial,
  kinds: ReadonlyMap<CreaseId, Exclude<CreaseKind, 'border'>>,
): Tutorial {
  let changed = false;
  const creases = document.creases.map((crease) => {
    const kind = kinds.get(crease.id);
    if (!kind || crease.kind === 'border' || crease.kind === kind) return crease;
    changed = true;
    return { ...crease, kind };
  });
  return changed ? { ...document, creases } : document;
}
