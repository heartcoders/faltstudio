import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { createModelId, deleteModel, getModel, listModels, saveModel } from './library.js';

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
});

const model = (id: string, updatedAt: string) => ({
  id,
  title: `Modell ${id}`,
  updatedAt,
  text: '{"meta":{"title":"x"}}',
});

describe('Modell-Bibliothek', () => {
  it('speichert, liest und loescht Modelle', async () => {
    await saveModel(model('a', '2026-09-28T10:00:00Z'));
    expect((await getModel('a'))?.title).toBe('Modell a');
    await deleteModel('a');
    expect(await getModel('a')).toBeUndefined();
  });

  it('listet zuletzt bearbeitete Modelle zuerst', async () => {
    await saveModel(model('alt', '2026-09-01T10:00:00Z'));
    await saveModel(model('neu', '2026-09-28T10:00:00Z'));
    expect((await listModels()).map((entry) => entry.id)).toEqual(['neu', 'alt']);
  });

  it('uebernimmt den alten Einzelentwurf einmalig als Modell', async () => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('faltstudio', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('drafts');
      request.onsuccess = () => {
        const transaction = request.result.transaction('drafts', 'readwrite');
        transaction
          .objectStore('drafts')
          .put({ text: '{"meta":{"title":"Alter Entwurf"}}', savedAt: '12:00' }, 'current');
        transaction.oncomplete = () => {
          request.result.close();
          resolve();
        };
      };
      request.onerror = () => reject(request.error);
    });
    const first = await listModels();
    expect(first.map((entry) => entry.title)).toEqual(['Alter Entwurf']);
    expect(await listModels()).toHaveLength(1);
  });

  it('vergibt eindeutige IDs', () => {
    expect(createModelId()).not.toBe(createModelId());
  });
});
