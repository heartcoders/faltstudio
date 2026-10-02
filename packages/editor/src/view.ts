import './fonts.js';
import { applyDocumentStyles } from '@faltstudio/ui/document';
import '@faltstudio/viewer/define';
import { findExample } from './state/examples.js';
import { getModel } from './state/library.js';
import { editorHref, readRoute, type ModelRoute } from './state/route.js';
import { decodeShare } from './state/share.js';

applyDocumentStyles();

async function readModelText(route: ModelRoute): Promise<string | undefined> {
  if (route.kind === 'model') return (await getModel(route.id))?.text;
  if (route.kind === 'example') return findExample(route.id)?.text;
  if (route.kind !== 'shared') return undefined;
  try {
    return await decodeShare(route.payload);
  } catch (error) {
    console.error('Geteilter Link nicht lesbar', error);
    return undefined;
  }
}

/**
 * Ansicht eines Modells aus der Bibliothek, eines Beispiels oder eines
 * geteilten Links im Viewer. Der Text wird als Blob-URL uebergeben, der Viewer
 * laedt ihn wie jede Datei. „Bearbeiten“ legt bei Beispielen und geteilten
 * Links eine eigene Kopie an.
 */
async function showModel(): Promise<void> {
  const viewer = document.querySelector('fl-viewer');
  if (!viewer) return;
  const route = readRoute(location.search, location.hash);
  const text = await readModelText(route);
  viewer.setAttribute('edit-href', editorHref(route));
  viewer.setAttribute(
    'src',
    text ? URL.createObjectURL(new Blob([text], { type: 'application/json' })) : 'about:blank',
  );
}

void showModel();
