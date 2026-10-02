import { PREFIX } from '../config.js';
import { DEV } from './dev.js';

/**
 * Die EINZIGE Datei, die `customElements.define` aufruft.
 * Idempotent, wirft nie. Name OHNE Prefix, z.B. define('button', Button).
 */
export function define(name: string, ctor: CustomElementConstructor): void {
  const tagName = `${PREFIX}-${name}`;
  const existing = customElements.get(tagName);
  if (existing === undefined) {
    customElements.define(tagName, ctor);
    return;
  }
  if (DEV && existing !== ctor) {
    console.warn(`[${PREFIX}] <${tagName}> ist bereits mit einer anderen Klasse registriert.`);
  }
}
