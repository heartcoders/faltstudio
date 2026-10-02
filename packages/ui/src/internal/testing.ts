import axe from 'axe-core';
import { OPEN } from '../config.js';

/**
 * Test-Helfer. Liegt in src/, damit `typecheck` ihn mitprueft, steht aber in
 * keinem Pfad der Exports-Map.
 */

/** Regeln, die eine ganze Seite bewerten und an einem Fragment per Definition fehlschlagen. */
const PAGE_LEVEL_RULES: axe.RuleObject = {
  region: { enabled: false },
  'page-has-heading-one': { enabled: false },
  'landmark-one-main': { enabled: false },
  bypass: { enabled: false },
};

export async function expectAccessible(element: Element): Promise<void> {
  const results = await axe.run(element, { rules: PAGE_LEVEL_RULES });
  if (results.violations.length === 0) return;
  const report = results.violations
    .map((violation) => `  ${violation.id}: ${violation.help}`)
    .join('\n');
  throw new Error(`axe fand ${results.violations.length} Verstoesse:\n${report}`);
}

export function partNames(element: Element): readonly string[] {
  const names = new Set<string>();
  for (const node of element.shadowRoot?.querySelectorAll('[part]') ?? []) {
    for (const name of (node.getAttribute('part') ?? '').split(/\s+/)) {
      if (name) names.add(name);
    }
  }
  return [...names].sort();
}

/** Im Lockdown darf kein [part] existieren, im offenen Modus genau die erwartete Liste. */
export function assertPublicSurface(element: Element, expected: readonly string[]): void {
  const actual = partNames(element).join(',');
  const wanted = OPEN ? [...expected].sort().join(',') : '';
  if (actual !== wanted) {
    throw new Error(`Public Surface weicht ab. Erwartet: [${wanted}], ist: [${actual}]`);
  }
}

export async function captureWarnings(run: () => unknown): Promise<readonly string[]> {
  const captured: string[] = [];
  const original = console.warn;
  console.warn = (...args: unknown[]) => {
    captured.push(args.map(String).join(' '));
  };
  try {
    await run();
  } finally {
    console.warn = original;
  }
  return captured;
}

export async function mount<T extends HTMLElement>(markup: string): Promise<T> {
  const container = document.createElement('div');
  container.innerHTML = markup;
  document.body.append(container);
  const element = container.firstElementChild as T & { updateComplete?: Promise<unknown> };
  await element.updateComplete;
  return element;
}
