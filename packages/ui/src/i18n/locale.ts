import type { ReactiveController, ReactiveControllerHost } from 'lit';

export const LOCALES = ['de', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

const STORAGE_KEY = 'faltstudio.locale';
const FALLBACK: Locale = 'en';

const isLocale = (value: unknown): value is Locale =>
  typeof value === 'string' && (LOCALES as readonly string[]).includes(value);

function readStored(): Locale | undefined {
  try {
    const stored = globalThis.localStorage?.getItem(STORAGE_KEY);
    return isLocale(stored) ? stored : undefined;
  } catch {
    return undefined;
  }
}

function readBrowser(): Locale | undefined {
  const languages = globalThis.navigator?.languages ?? [globalThis.navigator?.language ?? ''];
  return languages.map((tag) => tag.slice(0, 2).toLowerCase()).find(isLocale);
}

/** Ohne Speicher (privates Fenster, gesperrt) gilt die Wahl nur fuer diese Seite. */
function storeLocale(locale: Locale): void {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, locale);
  } catch {
    return;
  }
}

let current: Locale = readStored() ?? readBrowser() ?? FALLBACK;
const listeners = new Set<() => void>();

function applyDocumentLang(locale: Locale): void {
  if (typeof document !== 'undefined') document.documentElement.lang = locale;
}

applyDocumentLang(current);

/** Aktuelle UI-Sprache: gespeicherte Wahl, sonst Browsersprache, sonst Englisch. */
export function getLocale(): Locale {
  return current;
}

/**
 * Wechselt die UI-Sprache, merkt sie sich im Browser und zeichnet alle
 * Komponenten neu, die einen `LocaleController` haben (jedes `BaseElement`).
 *
 * @param locale - Neue Sprache.
 */
export function setLocale(locale: Locale): void {
  if (locale === current) return;
  current = locale;
  applyDocumentLang(locale);
  storeLocale(locale);
  for (const listener of listeners) listener();
}

/**
 * Meldet sich fuer Sprachwechsel an.
 *
 * @returns Funktion zum Abmelden.
 */
export function onLocaleChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Zeichnet den Host bei jedem Sprachwechsel neu. */
export class LocaleController implements ReactiveController {
  readonly #host: ReactiveControllerHost;
  #off: (() => void) | undefined;

  constructor(host: ReactiveControllerHost) {
    this.#host = host;
    host.addController(this);
  }

  hostConnected(): void {
    this.#off = onLocaleChange(() => this.#host.requestUpdate());
  }

  hostDisconnected(): void {
    this.#off?.();
    this.#off = undefined;
  }
}

/**
 * Ein Woerterbuch je Sprache mit derselben Form. Texte mit Werten sind
 * Funktionen, damit jede Sprache ihre eigene Satzstellung hat:
 * `stepOf: (step: number, total: number) => \`Schritt ${step} von ${total}\``.
 */
export type Catalog<T> = Readonly<Record<Locale, T>>;

/**
 * Liefert eine Funktion, die das Woerterbuch der aktuellen Sprache zurueckgibt.
 * Immer beim Rendern aufrufen, nicht zwischenspeichern, sonst bleibt nach dem
 * Wechsel die alte Sprache stehen. Mit Argument gilt eine feste Sprache, etwa
 * fuer ein eingebettetes Widget mit `lang`-Attribut.
 *
 * @example
 * const msg = messages({ de: { save: 'Speichern' }, en: { save: 'Save' } });
 * html`<button>${msg().save}</button>`;
 */
export function messages<T>(catalog: Catalog<T>): (locale?: Locale) => T {
  return (locale = current) => catalog[locale];
}

/**
 * Sprache aus einem `lang`-Attribut („en“, „de-AT“); passt sie nicht, gilt
 * die App-Sprache. Speichert nichts, die Wahl der Gastseite bleibt unberuehrt.
 *
 * @param tag - Wert des Attributs, auch leer.
 * @returns Unterstuetzte Sprache.
 */
export function resolveLocale(tag: string | null | undefined): Locale {
  const short = (tag ?? '').slice(0, 2).toLowerCase();
  return isLocale(short) ? short : current;
}

/** BCP-47-Tag fuer `Intl` und `toLocaleDateString`. */
export const localeTag = (locale: Locale = current): string =>
  locale === 'de' ? 'de-DE' : 'en-GB';
