import { messages } from './locale.js';

/** Texte der geteilten Komponenten; Vorgaben, die ein Aufrufer per Attribut ersetzen kann. */
interface UiMessages {
  readonly severity: { readonly error: string; readonly warning: string; readonly ok: string };
  readonly sheetLevel: { readonly peek: string; readonly half: string; readonly full: string };
  readonly sheetResize: (label: string) => string;
  readonly dialLabel: string;
  readonly degrees: (value: string) => string;
  readonly legendLabel: string;
  readonly legend: {
    readonly border: string;
    readonly valley: string;
    readonly mountain: string;
    readonly flat: string;
    readonly selected: string;
    readonly snap: string;
  };
  readonly foldKind: { readonly valley: string; readonly mountain: string };
  readonly warning: string;
  readonly progressLabel: string;
  readonly progressValue: (step: number, total: number, percent: number) => string;
  readonly sceneLabel: string;
}

const de: UiMessages = {
  severity: { error: 'Fehler', warning: 'Warnung', ok: 'In Ordnung' },
  sheetLevel: { peek: 'H1 · 64', half: 'H2 · 50 %', full: 'H3 · voll' },
  sheetResize: (label) => `${label}: Höhe ändern`,
  dialLabel: 'Faltwinkel',
  degrees: (value) => `${value} Grad`,
  legendLabel: 'Legende Faltlinien',
  legend: {
    border: 'Rand',
    valley: 'Talfalte',
    mountain: 'Bergfalte',
    flat: 'Flach / Hilfe',
    selected: 'Ausgewählt',
    snap: 'Einrastpunkt',
  },
  foldKind: { valley: 'Tal', mountain: 'Berg' },
  warning: 'Warnung',
  progressLabel: 'Fortschritt',
  progressValue: (step, total, percent) => `Schritt ${step} von ${total}, ${percent} Prozent`,
  sceneLabel: '3D-Ansicht des Blatts',
};

const en: UiMessages = {
  severity: { error: 'Error', warning: 'Warning', ok: 'OK' },
  sheetLevel: { peek: 'H1 · 64', half: 'H2 · 50 %', full: 'H3 · full' },
  sheetResize: (label) => `${label}: change height`,
  dialLabel: 'Fold angle',
  degrees: (value) => `${value} degrees`,
  legendLabel: 'Crease legend',
  legend: {
    border: 'Edge',
    valley: 'Valley fold',
    mountain: 'Mountain fold',
    flat: 'Flat / guide',
    selected: 'Selected',
    snap: 'Snap point',
  },
  foldKind: { valley: 'Valley', mountain: 'Mountain' },
  warning: 'Warning',
  progressLabel: 'Progress',
  progressValue: (step, total, percent) => `Step ${step} of ${total}, ${percent} percent`,
  sceneLabel: '3D view of the sheet',
};

/** Texte der UI-Komponenten in der aktuellen Sprache; beim Rendern aufrufen. */
export const uiMsg = messages({ de, en });
