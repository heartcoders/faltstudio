/**
 * Die EINZIGE Datei, die `dispatchEvent` aufruft. `composed: true` bringt das
 * Event ueber die Shadow-Grenze. Event-Namen: kleingeschrieben, ohne Trennzeichen.
 *
 * @returns false, wenn ein Listener preventDefault() gerufen hat.
 */
export function emit<T = unknown>(host: HTMLElement, name: string, detail?: T): boolean {
  return host.dispatchEvent(
    new CustomEvent(name, { bubbles: true, composed: true, cancelable: true, detail }),
  );
}
