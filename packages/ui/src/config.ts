/** Tag-Prefix ohne Bindestrich: `<fl-button>`, `<fl-scene>`. */
export const PREFIX = 'fl' as const;

/**
 * 'locked' — kein ::part(), keine Component-Tokens, Host hat keine Layout-Box.
 * 'open'   — ::part() und Component-Tokens sind oeffentliche API.
 *
 * Locked, weil der Viewer in fremde Seiten eingebettet wird und deren CSS das
 * Innenleben nicht erreichen soll. Die Annotation verhindert, dass TypeScript
 * den Wert auf das Literal verengt.
 */
export const STYLING: 'locked' | 'open' = 'locked';

export const TOKEN_NS = { theme: 't', component: 'c' } as const;

/**
 * Leer, solange nur eine Version der Library auf einer Seite laeuft. Mit einem
 * Wert wie 'v1' erzeugt `t()` eine zusaetzliche, versionierte Aufloesungsstufe.
 */
export const TOKEN_VERSION: string = '';

/** `as string` verhindert TS2367, wenn STYLING auf 'open' umgestellt wird. */
export const LOCKED = (STYLING as string) === 'locked';
export const OPEN = !LOCKED;
