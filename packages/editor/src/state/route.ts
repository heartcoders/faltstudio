import { readSharePayload, shareFragment } from './share.js';

/** Papierformat fuer ein neues Blatt (Startseite R3). */
export type SheetFormat = 'a4' | 'letter';

/** Welche Datei eine Seite oeffnet, aus der URL: ?model=…, ?example=…, ?new[&format=letter] oder #m=… (geteilt). */
export type ModelRoute =
  | { readonly kind: 'model'; readonly id: string }
  | { readonly kind: 'example'; readonly id: string }
  | { readonly kind: 'shared'; readonly payload: string }
  | { readonly kind: 'new'; readonly format?: SheetFormat };

const readFormat = (params: URLSearchParams): SheetFormat =>
  params.get('format') === 'letter' ? 'letter' : 'a4';

export function readRoute(search: string, hash = ''): ModelRoute {
  const payload = readSharePayload(hash);
  if (payload) return { kind: 'shared', payload };
  const params = new URLSearchParams(search);
  const model = params.get('model');
  if (model) return { kind: 'model', id: model };
  const example = params.get('example');
  if (example) return { kind: 'example', id: example };
  return { kind: 'new', format: readFormat(params) };
}

const query = (route: ModelRoute): string =>
  route.kind === 'shared'
    ? shareFragment(route.payload)
    : route.kind === 'model'
      ? `?model=${encodeURIComponent(route.id)}`
      : route.kind === 'example'
        ? `?example=${encodeURIComponent(route.id)}`
        : route.format === 'letter'
          ? '?new&format=letter'
          : '?new';

/** Mit welchem Modus der Editor startet; `photo` fuer „Aus Foto“ auf der Startseite. */
export type StartMode = 'photo' | 'lines';

export const readStartMode = (search: string): StartMode =>
  new URLSearchParams(search).get('mode') === 'photo' ? 'photo' : 'lines';

export const editorHref = (route: ModelRoute, mode: StartMode = 'lines'): string =>
  `./editor.html${query(route)}${mode === 'photo' && route.kind !== 'shared' ? '&mode=photo' : ''}`;
export const viewHref = (route: ModelRoute): string => `./view.html${query(route)}`;
export const HOME_HREF = './';

/** Vollstaendiger Link zur Ansicht, fuer QR-Code und Zwischenablage. */
export const absoluteHref = (href: string): string => new URL(href, location.href).href;
