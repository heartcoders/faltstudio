/**
 * Mechanische Pruefung der Invarianten aus lit-design-system/docs/decisions.md.
 * Gibt im gesunden Zustand nichts aus und endet mit Code 0.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const SRC = new URL('../src/', import.meta.url).pathname;

const RULES = [
  {
    name: '--t-/--c- nur in internal/tokens.ts',
    pattern: /--[tc]-/,
    allow: ['internal/tokens.ts'],
  },
  { name: 'part= nur ueber part()', pattern: /part="/, allow: ['internal/part.ts'] },
  {
    name: 'customElements.define nur in internal/define.ts',
    pattern: /customElements\.define/,
    allow: ['internal/define.ts'],
  },
  {
    name: 'dispatchEvent nur in internal/emit.ts',
    pattern: /dispatchEvent/,
    allow: ['internal/emit.ts'],
    skipTests: true,
  },
  {
    name: 'Event-Namen klein ohne Trennzeichen',
    pattern: /emit\(this, '[^']*[^a-z'][^']*'/,
    allow: [],
  },
];

function listFiles(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? listFiles(path) : path.endsWith('.ts') ? [path] : [];
  });
}

const violations = listFiles(SRC).flatMap((file) => {
  const rel = relative(SRC, file);
  const lines = readFileSync(file, 'utf8').split('\n');
  return RULES.filter((rule) => !rule.allow.includes(rel))
    .filter((rule) => !(rule.skipTests && rel.endsWith('.test.ts')))
    .flatMap((rule) =>
      lines.flatMap((line, index) =>
        rule.pattern.test(line) ? [`${rel}:${index + 1}  ${rule.name}`] : [],
      ),
    );
});

if (violations.length > 0) {
  console.error(violations.join('\n'));
  process.exit(1);
}
