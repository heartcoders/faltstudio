import { property } from 'lit/decorators.js';
import type { PropertyDeclaration } from 'lit';

/**
 * Attribut-gebundene Enum-Property. Ungueltige Attributwerte fallen auf den
 * Default zurueck. Der Default entfernt das Attribut, damit das DOM lesbar bleibt.
 * Per JS gesetzte Werte prueft nur TypeScript, deshalb zusaetzlich `checkEnum`
 * in `willUpdate`.
 */
export function enumProp<const T extends readonly string[]>(
  values: T,
  fallback: T[number],
  extra: Partial<PropertyDeclaration> = {},
) {
  const allowed = new Set<string>(values);
  return property({
    reflect: true,
    converter: {
      fromAttribute: (value: string | null) =>
        value !== null && allowed.has(value) ? value : fallback,
      toAttribute: (value: string) => (value === fallback ? null : value),
    },
    ...extra,
  });
}

export const boolProp = (extra: Partial<PropertyDeclaration> = {}) =>
  property({ type: Boolean, reflect: true, ...extra });

interface NumberPropOptions {
  readonly min?: number;
  readonly max?: number;
  readonly fallback?: number;
}

export function numberProp(
  { min = -Infinity, max = Infinity, fallback = 0 }: NumberPropOptions = {},
  extra: Partial<PropertyDeclaration> = {},
) {
  return property({
    reflect: true,
    converter: {
      fromAttribute: (value: string | null) => {
        const parsed = Number(value);
        if (value === null || Number.isNaN(parsed)) return fallback;
        return Math.min(max, Math.max(min, parsed));
      },
      toAttribute: (value: number) => (value === fallback ? null : String(value)),
    },
    ...extra,
  });
}

/** Meldet per Callback, wenn ein per JS gesetzter Wert nicht erlaubt ist. */
export function checkEnum<T extends readonly string[]>(
  values: T,
  value: unknown,
  propName: string,
  warn: (...args: readonly unknown[]) => void,
): void {
  if (typeof value === 'string' && values.includes(value)) return;
  warn(`${propName}="${String(value)}" ist ungueltig. Erlaubt: ${values.join(' | ')}.`);
}
