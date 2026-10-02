import { editorText } from '../i18n/editor.js';

/**
 * Lokale Modell-Bibliothek (IndexedDB). Jedes Modell ist die Tutorial-Datei als
 * Text plus Kopfdaten fuer die Startseite. Ohne Backend bleibt alles im Browser.
 */
const DATABASE = 'faltstudio';
const VERSION = 2;
const MODELS = 'models';
const LEGACY_DRAFTS = 'drafts';

export interface StoredModel {
  readonly id: string;
  readonly title: string;
  readonly updatedAt: string;
  readonly text: string;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(MODELS))
        database.createObjectStore(MODELS, { keyPath: 'id' });
      if (!database.objectStoreNames.contains(LEGACY_DRAFTS))
        database.createObjectStore(LEGACY_DRAFTS);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error(editorText().messages.storageMissing));
  });
}

async function run<T>(
  store: string,
  mode: IDBTransactionMode,
  action: (objects: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const database = await openDatabase();
  try {
    return await new Promise<T>((resolve, reject) => {
      const request = action(database.transaction(store, mode).objectStore(store));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () =>
        reject(request.error ?? new Error(editorText().messages.storageFailed));
    });
  } finally {
    database.close();
  }
}

const isModel = (value: unknown): value is StoredModel => {
  const model = value as Partial<StoredModel> | undefined;
  return (
    typeof model?.id === 'string' &&
    typeof model.text === 'string' &&
    typeof model.title === 'string' &&
    typeof model.updatedAt === 'string'
  );
};

export function createModelId(): string {
  return `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Der alte Einzelentwurf (vor der Bibliothek) wird einmalig zu einem Modell. */
async function migrateLegacyDraft(): Promise<void> {
  const draft = (await run<unknown>(LEGACY_DRAFTS, 'readonly', (store) => store.get('current'))) as
    { text?: unknown } | undefined;
  if (typeof draft?.text !== 'string') return;
  const title = (JSON.parse(draft.text) as { meta?: { title?: string } }).meta?.title ?? 'Entwurf';
  await saveModel({
    id: createModelId(),
    title,
    updatedAt: new Date().toISOString(),
    text: draft.text,
  });
  await run(LEGACY_DRAFTS, 'readwrite', (store) => store.delete('current'));
}

/** Alle Modelle, zuletzt bearbeitete zuerst. Fehler (privater Modus) ergeben eine leere Liste. */
export async function listModels(): Promise<readonly StoredModel[]> {
  try {
    await migrateLegacyDraft();
    const all = await run<unknown[]>(MODELS, 'readonly', (store) => store.getAll());
    return all.filter(isModel).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  } catch {
    return [];
  }
}

export async function getModel(id: string): Promise<StoredModel | undefined> {
  try {
    const value = await run<unknown>(MODELS, 'readonly', (store) => store.get(id));
    return isModel(value) ? value : undefined;
  } catch {
    return undefined;
  }
}

export async function saveModel(model: StoredModel): Promise<void> {
  await run(MODELS, 'readwrite', (store) => store.put(model));
}

export async function deleteModel(id: string): Promise<void> {
  await run(MODELS, 'readwrite', (store) => store.delete(id));
}
