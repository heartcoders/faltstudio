import {
  SHEET_A4,
  SHEET_LETTER,
  createDocument,
  parseTutorial,
  type Tutorial,
} from '@faltstudio/core';
import { findExample } from './examples.js';
import { createModelId, getModel, type StoredModel } from './library.js';
import { decodeShare } from './share.js';
import type { ModelRoute } from './route.js';
import { editorText } from '../i18n/editor.js';

export interface BootDocument {
  readonly document: Tutorial;
  /** Unter dieser ID speichert der Editor laufend in die Bibliothek. */
  readonly modelId: string;
  readonly message: string;
}

/**
 * Startdokument nach URL: gespeichertes Modell, Kopie eines Beispiels oder ein
 * leeres A4-Blatt. Beispiele werden nie ueberschrieben; die erste Aenderung legt
 * ein eigenes Modell an.
 */
export async function bootDocument(route: ModelRoute): Promise<BootDocument> {
  if (route.kind === 'model') {
    const stored = await getModel(route.id);
    if (stored) return bootStored(stored);
  }
  if (route.kind === 'shared') return bootShared(route.payload);
  if (route.kind === 'example') {
    const example = findExample(route.id);
    if (example) {
      const copy = parseTutorial(example.text);
      const text = editorText().messages;
      const title = `${copy.meta.title} (${text.copySuffix})`;
      const document = { ...copy, meta: { ...copy.meta, title } };
      return { document, modelId: createModelId(), message: text.exampleCopied };
    }
  }
  const letter = route.kind === 'new' && route.format === 'letter';
  const text = editorText().messages;
  const message =
    route.kind === 'new'
      ? text.newSheet(letter ? editorText().photo.letter : 'A4')
      : text.modelNotFound;
  return {
    document: createDocument(letter ? SHEET_LETTER : SHEET_A4),
    modelId: createModelId(),
    message,
  };
}

/**
 * Ein geteiltes Modell wird zur eigenen Kopie. Gespeichert wird sie vom Editor
 * gleich nach dem Start (`flush`), der dabei auch das Fragment aus der URL nimmt.
 */
async function bootShared(payload: string): Promise<BootDocument> {
  try {
    const document = parseTutorial(await decodeShare(payload));
    return {
      document,
      modelId: createModelId(),
      message: editorText().messages.sharedSaved,
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return {
      document: createDocument(SHEET_A4),
      modelId: createModelId(),
      message: editorText().messages.linkUnreadable(reason),
    };
  }
}

/**
 * Ein beschaedigtes Modell bleibt unangetastet in der Bibliothek; der Editor
 * oeffnet stattdessen ein neues Blatt unter eigener ID, statt abzustuerzen.
 */
function bootStored(stored: StoredModel): BootDocument {
  try {
    return {
      document: parseTutorial(stored.text),
      modelId: stored.id,
      message: editorText().messages.modelOpened,
    };
  } catch (error) {
    console.error('Gespeichertes Modell nicht lesbar', stored.id, error);
    return {
      document: createDocument(SHEET_A4),
      modelId: createModelId(),
      message: editorText().messages.modelBroken,
    };
  }
}
