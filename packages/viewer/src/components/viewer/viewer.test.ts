import { afterEach, describe, expect, it } from 'vitest';
import {
  SHEET_A4,
  addLines,
  createDocument,
  insertStep,
  serializeTutorial,
  setFold,
  updateStep,
  type Tutorial,
} from '@faltstudio/core';
import { setLocale } from '@faltstudio/ui';
import './define.js';
import type { Viewer } from './viewer.js';

function tinyTutorial(): Tutorial {
  const lines = addLines(createDocument(SHEET_A4, 'Halbe', '2026-09-25'), [
    { id: 'M', a: [105, 0], b: [105, 297], kind: 'valley' },
  ]);
  const { document } = insertStep(lines, 0, 'In der Mitte falten');
  const described = updateStep(document, 0, { text: 'Linke Hälfte auf die rechte legen.' });
  return setFold(described, 0, 0, { creaseIds: ['M'], movingPoint: [50, 150], angle: 180 });
}

const asDataUrl = (text: string): string =>
  `data:application/json;charset=utf-8,${encodeURIComponent(text)}`;

const shadow = (viewer: Viewer): ShadowRoot => viewer.shadowRoot as ShadowRoot;

const text = (viewer: Viewer, selector: string): string =>
  shadow(viewer).querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim() ?? '';

async function until(check: () => boolean, timeout = 4000): Promise<void> {
  const start = performance.now();
  while (!check()) {
    if (performance.now() - start > timeout) throw new Error('Zeitueberschreitung');
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

async function mountViewer(source: string, embedded = false): Promise<Viewer> {
  const viewer = document.createElement('fl-viewer') as Viewer;
  if (embedded) viewer.setAttribute('embedded', '');
  viewer.style.blockSize = '600px';
  viewer.src = source;
  document.body.append(viewer);
  await viewer.updateComplete;
  return viewer;
}

const primary = (viewer: Viewer): HTMLButtonElement =>
  shadow(viewer)
    .querySelector('.primary fl-button')
    ?.shadowRoot?.querySelector('button') as HTMLButtonElement;

afterEach(() => {
  setLocale('de');
  document.body.replaceChildren();
});

describe('fl-viewer', () => {
  it('laedt ein Tutorial und zeigt Titel und ersten Schritt', async () => {
    const viewer = await mountViewer(asDataUrl(serializeTutorial(tinyTutorial())));
    await until(() => text(viewer, '.step-title') === 'In der Mitte falten');
    expect(text(viewer, '.hint .caption')).toBe('Schritt 01 von 01');
    expect(text(viewer, '.bar-title')).toContain('Halbe');
  });

  it('meldet kaputte Dateien mit Pfad statt still leer zu bleiben', async () => {
    const broken = JSON.stringify({
      ...tinyTutorial(),
      creases: [{ id: 'X', a: 'nope', b: 'nope', kind: 'squash' }],
    });
    const viewer = await mountViewer(asDataUrl(broken));
    await until(() => text(viewer, '.step-title') === 'Tutorial nicht lesbar');
    expect(text(viewer, '.step-text')).toContain('kein gültiges Tutorial');
    expect(text(viewer, '.step-text')).toContain('creases');
  });

  it('faltet mit einem Klick auf "Weiter" zu Ende und meldet complete', async () => {
    const viewer = await mountViewer(asDataUrl(serializeTutorial(tinyTutorial())));
    await until(() => primary(viewer) !== null && !primary(viewer).disabled);
    let completed = 0;
    viewer.addEventListener('complete', () => completed++);
    primary(viewer).click();
    await until(() => text(viewer, '.state-chip').includes('Eingerastet'));
    expect(text(viewer, '.state-chip')).toContain('180°');
    await until(() => completed === 1);
    expect(text(viewer, '.step-title')).toContain('Fertig');
  });

  it('meldet den Schrittwechsel mit Index und Anzahl', async () => {
    const document = tinyTutorial();
    const twoSteps = {
      ...document,
      steps: [
        ...document.steps,
        {
          ...document.steps[0],
          id: 's2',
          title: 'Zurück',
          folds: [{ creaseIds: ['M'], movingPoint: [50, 150] as const, angle: -180 }],
        },
      ],
    } as Tutorial;
    const viewer = await mountViewer(asDataUrl(serializeTutorial(twoSteps)));
    await until(() => primary(viewer) !== null && !primary(viewer).disabled);
    const seen: { index: number; count: number }[] = [];
    viewer.addEventListener('stepchange', (event) =>
      seen.push((event as CustomEvent<{ index: number; count: number }>).detail),
    );
    primary(viewer).click();
    await until(() => seen.length === 1);
    expect(seen).toEqual([{ index: 1, count: 2 }]);
    expect(text(viewer, '.step-title')).toBe('Zurück');
  });

  it('zeigt Umriss-Ziffer, Strichleiste und das Menue hinter ⋯', async () => {
    const viewer = await mountViewer(asDataUrl(serializeTutorial(tinyTutorial())));
    viewer.editHref = './editor.html';
    await until(() => text(viewer, '.state-chip').includes('Bereit'));
    expect(text(viewer, '.index')).toBe('01');
    expect(shadow(viewer).querySelectorAll('.tick')).toHaveLength(1);
    const menu = shadow(viewer).querySelector<HTMLButtonElement>('[aria-label="Menü"]');
    menu?.click();
    await viewer.updateComplete;
    expect(text(viewer, '.menu')).toContain('Bearbeiten');
    expect(menu?.getAttribute('aria-expanded')).toBe('true');
  });

  it('spricht Englisch, wenn die App-Sprache wechselt', async () => {
    const viewer = await mountViewer(asDataUrl(serializeTutorial(tinyTutorial())));
    await until(() => text(viewer, '.state-chip').includes('Bereit'));
    setLocale('en');
    await viewer.updateComplete;
    expect(text(viewer, '.state-chip')).toContain('Ready');
    expect(text(viewer, '.hint .caption')).toBe('Step 01 of 01');
    expect(shadow(viewer).querySelector('[aria-label="Menu"]')).toBeTruthy();
  });

  it('nimmt eingebettet die Sprache aus lang, ohne die App-Sprache zu aendern', async () => {
    const viewer = document.createElement('fl-viewer') as Viewer;
    viewer.setAttribute('embedded', '');
    viewer.setAttribute('lang', 'en');
    viewer.src = asDataUrl(serializeTutorial(tinyTutorial()));
    document.body.append(viewer);
    await until(() => text(viewer, '.embed-bar').includes('Step 01 / 01'));
    expect(text(viewer, '.open-link')).toBe('Open in Faltstudio ↗');
    expect(document.documentElement.lang).toBe('de');
  });

  it('zeigt eingebettet die kompakte Kopfzeile mit Link', async () => {
    const viewer = await mountViewer(asDataUrl(serializeTutorial(tinyTutorial())), true);
    await until(() => text(viewer, '.embed-bar').includes('Schritt 01 / 01'));
    expect(shadow(viewer).querySelector('.open-link')).toBeTruthy();
  });
});
