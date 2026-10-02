import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { turntableModel } from './turntable-model.js';

const dart = readFileSync(new URL('../../../../../examples/dart-a4.json', import.meta.url), 'utf8');

describe('3D-Vorschau der Uebersicht', () => {
  it('zeigt den fertigen Flieger in Ruhelage', () => {
    const model = turntableModel(dart);
    expect(model?.pose).toBeDefined();
    expect(model?.state.transforms.size).toBeGreaterThan(0);
  });

  it('zeigt ohne Schritte das flache Blatt ohne Drehung', () => {
    const model = turntableModel(JSON.stringify({ ...JSON.parse(dart), steps: [] }));
    expect(model?.pose).toBeUndefined();
  });

  it('gibt bei kaputter Datei nichts zurueck, die Karte bleibt beim 2D-Muster', () => {
    expect(turntableModel('{kaputt')).toBeUndefined();
  });
});
