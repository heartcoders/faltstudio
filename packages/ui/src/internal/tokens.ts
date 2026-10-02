import { unsafeCSS, type CSSResult } from 'lit';
import { TOKEN_NS, TOKEN_VERSION, OPEN } from '../config.js';
import { tokens, type TokenName } from '../tokens/tokens.js';

/**
 * Die EINZIGE Datei, in der `--t-` und `--c-` als String-Literal vorkommen duerfen.
 * Component-Styles schreiben `color: ${t('text')}`, ein Tippfehler im Namen ist
 * damit ein Compile-Fehler statt einer stillen leeren Custom Property.
 */

const versionSuffix = TOKEN_VERSION ? `-${TOKEN_VERSION}` : '';

function resolve(base: string, fallback: string): CSSResult {
  const value = versionSuffix
    ? `var(${base}${versionSuffix}, var(${base}, ${fallback}))`
    : `var(${base}, ${fallback})`;
  return unsafeCSS(value);
}

/** Theme-Token mit Wert aus tokens.ts als Fallback. Der Fallback ist nie optional. */
export function t(name: TokenName): CSSResult {
  return resolve(`--${TOKEN_NS.theme}-${name}`, tokens[name]);
}

/** Roher Token-Name fuer Stellen ausserhalb von CSS, etwa three.js-Materialien. */
export function tokenVar(name: TokenName): string {
  return `--${TOKEN_NS.theme}-${name}`;
}

/**
 * Component-Token: dokumentierter Escape-Hatch im offenen Modus. Im Lockdown
 * kompiliert der Aufruf zum Fallback, das var() verschwindet vollstaendig.
 */
export function c(name: string, fallback: CSSResult | string): CSSResult {
  if (!OPEN) return unsafeCSS(String(fallback));
  return resolve(`--${TOKEN_NS.component}-${name}`, String(fallback));
}
