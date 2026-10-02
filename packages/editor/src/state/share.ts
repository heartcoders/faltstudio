import { parseTutorial, type Tutorial } from '@faltstudio/core';

/** Kennung im Fragment: `view.html#m=<Daten>`. Das Fragment geht nie an einen Server. */
const SHARE_KEY = 'm';

/**
 * Laenge, bis zu der ein Link noch als QR-Code passt (Version 40, Stufe L,
 * Byte-Modus: 2953 Zeichen). Darueber gibt es nur den Link.
 */
export const QR_LIMIT = 2953;

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

function fromBase64Url(text: string): Uint8Array<ArrayBuffer> {
  const binary = atob(text.replaceAll('-', '+').replaceAll('_', '/'));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function transform(
  bytes: Uint8Array<ArrayBuffer>,
  stream: GenericTransformStream,
): Promise<Uint8Array> {
  const piped = new Blob([bytes]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(piped).arrayBuffer());
}

function withoutPhoto(tutorial: Tutorial): Tutorial {
  const shared = { ...tutorial };
  delete (shared as { reference?: unknown }).reference;
  return shared;
}

/**
 * Packt ein Modell fuer einen Teilen-Link. Das Foto bleibt weg: es macht den
 * Link hundertfach groesser und wird zum Falten nicht gebraucht.
 *
 * @param tutorial - Das zu teilende Modell.
 * @returns Komprimierte Daten, URL-sicher kodiert.
 */
export async function encodeShare(tutorial: Tutorial): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(withoutPhoto(tutorial)));
  return toBase64Url(await transform(bytes, new CompressionStream('deflate-raw')));
}

/**
 * Entpackt die Daten eines Teilen-Links und prueft sie wie jede Datei.
 *
 * @param payload - Daten aus dem Fragment.
 * @returns Die Tutorial-Datei als Text.
 * @throws {TutorialFormatError} Wenn die Daten kein gueltiges Modell sind.
 */
export async function decodeShare(payload: string): Promise<string> {
  const bytes = await transform(fromBase64Url(payload), new DecompressionStream('deflate-raw'));
  const text = new TextDecoder().decode(bytes);
  parseTutorial(text);
  return text;
}

/** Daten aus einem Fragment `#m=…`, sonst undefined. */
export function readSharePayload(hash: string): string | undefined {
  const payload = new URLSearchParams(hash.replace(/^#/, '')).get(SHARE_KEY);
  return payload || undefined;
}

export const shareFragment = (payload: string): string => `#${SHARE_KEY}=${payload}`;
