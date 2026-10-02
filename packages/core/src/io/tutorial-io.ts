import { FORMAT_VERSION, type Tutorial } from '../model/index.js';
import { checkTutorialSchema, type SchemaIssue } from '../validate/index.js';

export class TutorialFormatError extends Error {
  constructor(
    message: string,
    readonly issues: readonly SchemaIssue[] = [],
  ) {
    super(message);
    this.name = 'TutorialFormatError';
  }
}

type Migration = (data: Readonly<Record<string, unknown>>) => Readonly<Record<string, unknown>>;

/**
 * Migration von Version n auf n + 1. Jede Formataenderung erhoeht
 * FORMAT_VERSION und traegt hier ihre Migration ein (Handover, Dateiformat).
 */
const MIGRATIONS: Readonly<Record<number, Migration>> = {};

function migrate(data: Readonly<Record<string, unknown>>): Readonly<Record<string, unknown>> {
  let current = data;
  let version = Number(current['formatVersion']);
  if (!Number.isInteger(version) || version < 1)
    throw new TutorialFormatError('formatVersion fehlt oder ist ungueltig.');
  if (version > FORMAT_VERSION)
    throw new TutorialFormatError(
      `formatVersion ${version} ist neuer als diese App (${FORMAT_VERSION}).`,
    );
  while (version < FORMAT_VERSION) {
    const step = MIGRATIONS[version];
    if (!step) throw new TutorialFormatError(`Keine Migration von Version ${version}.`);
    current = { ...step(current), formatVersion: version + 1 };
    version += 1;
  }
  return current;
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new TutorialFormatError(`Keine gueltige JSON-Datei: ${(error as Error).message}`);
  }
}

/** Liest, migriert und prueft eine Tutorial-Datei. Wirft `TutorialFormatError` mit allen Befunden. */
export function parseTutorial(text: string): Tutorial {
  const raw = parseJson(text);
  if (typeof raw !== 'object' || raw === null)
    throw new TutorialFormatError('Die Datei enthaelt kein Objekt.');
  const migrated = migrate(raw as Readonly<Record<string, unknown>>);
  const issues = checkTutorialSchema(migrated);
  if (issues.length > 0)
    throw new TutorialFormatError(`${issues.length} Fehler in der Datei.`, issues);
  return migrated as unknown as Tutorial;
}

/** Nur Quelldaten; Flaechen und Zustaende werden beim Laden neu berechnet. */
export function serializeTutorial(tutorial: Tutorial): string {
  return `${JSON.stringify(tutorial, null, 2)}\n`;
}
