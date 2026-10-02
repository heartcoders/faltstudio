import { CREASE_KINDS } from '../model/index.js';

export interface SchemaIssue {
  readonly path: string;
  readonly message: string;
}

type Record_ = Readonly<Record<string, unknown>>;

const isRecord = (value: unknown): value is Record_ =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isPoint = (value: unknown): boolean =>
  Array.isArray(value) && value.length === 2 && value.every(isFiniteNumber);

function check(issues: SchemaIssue[], condition: boolean, path: string, message: string): void {
  if (!condition) issues.push({ path, message });
}

function checkMeta(root: Record_, issues: SchemaIssue[]): void {
  const meta = root['meta'];
  check(issues, isRecord(meta), 'meta', 'fehlt oder ist kein Objekt');
  if (!isRecord(meta)) return;
  for (const key of ['title', 'author', 'date'])
    check(issues, typeof meta[key] === 'string', `meta.${key}`, 'muss Text sein');
}

function checkSheet(root: Record_, issues: SchemaIssue[]): void {
  const sheet = root['sheet'];
  const valid =
    isRecord(sheet) && isFiniteNumber(sheet['width']) && isFiniteNumber(sheet['height']);
  check(
    issues,
    valid && Number(sheet['width']) > 0 && Number(sheet['height']) > 0,
    'sheet',
    'braucht positive Breite und Hoehe in mm',
  );
}

function checkIds(
  items: readonly unknown[],
  path: string,
  issues: SchemaIssue[],
): ReadonlySet<string> {
  const ids = new Set<string>();
  items.forEach((item, index) => {
    const id = isRecord(item) ? item['id'] : undefined;
    check(
      issues,
      typeof id === 'string' && id.length > 0,
      `${path}[${index}].id`,
      'muss ein nicht leerer Text sein',
    );
    if (typeof id !== 'string') return;
    check(issues, !ids.has(id), `${path}[${index}].id`, `"${id}" ist doppelt`);
    ids.add(id);
  });
  return ids;
}

function listAt(root: Record_, key: string, issues: SchemaIssue[]): readonly unknown[] {
  const value = root[key];
  check(issues, Array.isArray(value), key, 'muss eine Liste sein');
  return Array.isArray(value) ? value : [];
}

function checkVertices(vertices: readonly unknown[], issues: SchemaIssue[]): void {
  vertices.forEach((vertex, index) => {
    const valid = isRecord(vertex) && isFiniteNumber(vertex['x']) && isFiniteNumber(vertex['y']);
    check(issues, valid, `vertices[${index}]`, 'braucht x und y in mm');
  });
}

function checkCreases(
  creases: readonly unknown[],
  vertexIds: ReadonlySet<string>,
  issues: SchemaIssue[],
): void {
  creases.forEach((crease, index) => {
    const path = `creases[${index}]`;
    if (!isRecord(crease)) return check(issues, false, path, 'ist kein Objekt');
    for (const end of ['a', 'b'])
      check(
        issues,
        vertexIds.has(String(crease[end])),
        `${path}.${end}`,
        'verweist auf keinen Vertex',
      );
    check(
      issues,
      (CREASE_KINDS as readonly unknown[]).includes(crease['kind']),
      `${path}.kind`,
      `muss ${CREASE_KINDS.join(' | ')} sein`,
    );
  });
}

function checkFold(
  fold: unknown,
  path: string,
  creaseIds: ReadonlySet<string>,
  issues: SchemaIssue[],
): void {
  if (!isRecord(fold)) return check(issues, false, path, 'ist kein Objekt');
  const ids = fold['creaseIds'];
  check(
    issues,
    Array.isArray(ids) && ids.length > 0,
    `${path}.creaseIds`,
    'muss mindestens eine Crease nennen',
  );
  if (Array.isArray(ids))
    ids.forEach((id, index) =>
      check(
        issues,
        creaseIds.has(String(id)),
        `${path}.creaseIds[${index}]`,
        `"${String(id)}" gibt es nicht`,
      ),
    );
  check(issues, isPoint(fold['movingPoint']), `${path}.movingPoint`, 'muss [x, y] in mm sein');
  const angle = fold['angle'];
  check(
    issues,
    isFiniteNumber(angle) && Math.abs(angle) <= 180,
    `${path}.angle`,
    'muss zwischen -180 und 180 Grad liegen',
  );
}

function checkSteps(
  steps: readonly unknown[],
  creaseIds: ReadonlySet<string>,
  issues: SchemaIssue[],
): void {
  steps.forEach((step, index) => {
    const path = `steps[${index}]`;
    if (!isRecord(step)) return check(issues, false, path, 'ist kein Objekt');
    for (const key of ['title', 'text'])
      check(issues, typeof step[key] === 'string', `${path}.${key}`, 'muss Text sein');
    const folds = Array.isArray(step['folds']) ? step['folds'] : [];
    check(issues, Array.isArray(step['folds']), `${path}.folds`, 'muss eine Liste sein');
    folds.forEach((fold, foldIndex) =>
      checkFold(fold, `${path}.folds[${foldIndex}]`, creaseIds, issues),
    );
  });
}

function checkReference(root: Record_, issues: SchemaIssue[]): void {
  const reference = root['reference'];
  if (reference === undefined) return;
  if (!isRecord(reference)) return check(issues, false, 'reference', 'ist kein Objekt');
  check(
    issues,
    typeof reference['imageDataUrl'] === 'string' &&
      reference['imageDataUrl'].startsWith('data:image/'),
    'reference.imageDataUrl',
    'muss eine Bild-Data-URL sein',
  );
  check(
    issues,
    isPoint(reference['size']),
    'reference.size',
    'muss [Breite, Hoehe] in Pixeln sein',
  );
  const corners = reference['corners'];
  check(
    issues,
    Array.isArray(corners) && corners.length === 4 && corners.every(isPoint),
    'reference.corners',
    'braucht vier Punkte [x, y]',
  );
  const opacity = reference['opacity'];
  check(
    issues,
    isFiniteNumber(opacity) && opacity >= 0 && opacity <= 1,
    'reference.opacity',
    'muss zwischen 0 und 1 liegen',
  );
}

/** Strukturpruefung eines Tutorials. Leere Liste = gueltig. Geometrie prueft `validate/` getrennt. */
export function checkTutorialSchema(value: unknown): readonly SchemaIssue[] {
  const issues: SchemaIssue[] = [];
  if (!isRecord(value)) return [{ path: '', message: 'Die Datei enthaelt kein Objekt.' }];
  checkMeta(value, issues);
  checkSheet(value, issues);
  const vertices = listAt(value, 'vertices', issues);
  const creases = listAt(value, 'creases', issues);
  const steps = listAt(value, 'steps', issues);
  const vertexIds = checkIds(vertices, 'vertices', issues);
  checkVertices(vertices, issues);
  checkCreases(creases, vertexIds, issues);
  checkSteps(steps, checkIds(creases, 'creases', issues), issues);
  checkIds(steps, 'steps', issues);
  checkReference(value, issues);
  return issues;
}
