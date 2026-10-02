import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';
import { parseTutorial } from '@faltstudio/core';

import { editorHref, readRoute, viewHref } from './route.js';
import { decodeShare, encodeShare, QR_LIMIT, readSharePayload } from './share.js';

const dart = parseTutorial(
  readFileSync(new URL('../../../../examples/dart-a4.json', import.meta.url), 'utf8'),
);

describe('Teilen-Link', () => {
  it('traegt das Modell verlustfrei hin und zurueck', async () => {
    const payload = await encodeShare(dart);
    expect(parseTutorial(await decodeShare(payload))).toEqual(dart);
  });

  it('laesst das Foto weg und bleibt klein genug fuer einen QR-Code', async () => {
    const withPhoto = {
      ...dart,
      reference: {
        imageDataUrl: `data:image/png;base64,${'A'.repeat(50_000)}`,
        size: [1600, 1200] as const,
        corners: [
          [0, 0],
          [1600, 0],
          [1600, 1200],
          [0, 1200],
        ] as const,
        opacity: 0.6,
      },
    } as unknown as typeof dart;
    const payload = await encodeShare(withPhoto);
    expect(parseTutorial(await decodeShare(payload)).reference).toBeUndefined();
    expect(payload.length).toBeLessThan(QR_LIMIT);
    expect(payload).toMatch(/^[\w-]+$/);
  });

  it('lehnt kaputte Daten ab', async () => {
    await expect(decodeShare('kaputt')).rejects.toThrow();
  });

  it('liest das Fragment und baut die Links', async () => {
    const payload = await encodeShare(dart);
    const route = readRoute('', `#m=${payload}`);
    expect(route).toEqual({ kind: 'shared', payload });
    expect(viewHref(route)).toBe(`./view.html#m=${payload}`);
    expect(editorHref(route, 'photo')).toBe(`./editor.html#m=${payload}`);
    expect(readSharePayload('#x=1')).toBeUndefined();
  });
});
