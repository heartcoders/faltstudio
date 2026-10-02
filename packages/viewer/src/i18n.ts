import { messages } from '@faltstudio/ui';

/** Texte des Viewers. Tutorial-Inhalte (Titel, Schritte) sind Daten und stehen hier nicht. */
interface ViewerMessages {
  readonly state: {
    readonly ready: string;
    readonly dragging: string;
    readonly snapped: string;
    readonly done: string;
  };
  readonly chip: {
    readonly ready: string;
    readonly snapped: (degrees: string) => string;
    readonly done: (degrees: string) => string;
    readonly release: (degrees: string) => string;
    readonly auto: (degrees: string) => string;
    readonly drag: (degrees: string) => string;
  };
  readonly stepOf: (step: string, total: string) => string;
  readonly embedStep: (step: string, total: string) => string;
  readonly openInStudio: string;
  readonly allModels: string;
  readonly edit: string;
  readonly readingAid: string;
  readonly fitCamera: string;
  readonly restart: string;
  readonly menu: string;
  readonly viewerNav: string;
  readonly embedHint: string;
  readonly aid: {
    readonly grip: string;
    readonly axis: string;
    readonly ghost: string;
    readonly path: string;
  };
  readonly loadFailed: string;
  readonly loadHttp: (status: number) => string;
  readonly loadFormat: (path: string) => string;
  readonly loadOther: (detail: string) => string;
  readonly loading: string;
  readonly doneTitle: string;
  readonly doneText: string;
  readonly again: string;
  readonly next: string;
  readonly back: string;
  readonly demonstrate: string;
  readonly controls: string;
  readonly progress: string;
  readonly scene: string;
}

const de: ViewerMessages = {
  state: { ready: 'Bereit', dragging: 'Ziehen', snapped: 'Eingerastet', done: 'Fertig' },
  chip: {
    ready: 'Bereit · Ecke greifen',
    snapped: (degrees) => `Eingerastet · ${degrees}`,
    done: (degrees) => `Fertig · ${degrees}`,
    release: (degrees) => `Losgelassen · ∠ ${degrees}`,
    auto: (degrees) => `Falten · ∠ ${degrees}`,
    drag: (degrees) => `Ziehen · ∠ ${degrees}`,
  },
  stepOf: (step, total) => `Schritt ${step} von ${total}`,
  embedStep: (step, total) => `Schritt ${step} / ${total}`,
  openInStudio: 'In Faltstudio öffnen ↗',
  allModels: 'Alle Modelle',
  edit: 'Bearbeiten',
  readingAid: 'Lesehilfe',
  fitCamera: 'Kamera einpassen',
  restart: 'Von vorn',
  menu: 'Menü',
  viewerNav: 'Viewer',
  embedHint: 'Ecke ziehen oder „Weiter“ tippen.',
  aid: {
    grip: 'Greifpunkt — ziehen',
    axis: 'Faltachse',
    ghost: 'Ziel (Ghost)',
    path: 'Bahn der Ecke',
  },
  loadFailed: 'Tutorial nicht lesbar',
  loadHttp: (status) => `Die Datei ist nicht erreichbar (HTTP ${status}).`,
  loadFormat: (path) =>
    path
      ? `Die Datei ist kein gültiges Tutorial (bei „${path}“).`
      : 'Die Datei ist kein gültiges Tutorial.',
  loadOther: (detail) => `Die Datei ließ sich nicht laden: ${detail}`,
  loading: 'Lädt …',
  doneTitle: 'Fertig — guten Flug!',
  doneText: 'Alle Schritte gefaltet.',
  again: 'Nochmal',
  next: 'Weiter',
  back: 'Zurück',
  demonstrate: 'Vorführen',
  controls: 'Steuerung',
  progress: 'Fortschritt',
  scene: '3D-Ansicht des Blatts',
};

const en: ViewerMessages = {
  state: { ready: 'Ready', dragging: 'Dragging', snapped: 'Snapped', done: 'Done' },
  chip: {
    ready: 'Ready · grab the corner',
    snapped: (degrees) => `Snapped · ${degrees}`,
    done: (degrees) => `Done · ${degrees}`,
    release: (degrees) => `Released · ∠ ${degrees}`,
    auto: (degrees) => `Folding · ∠ ${degrees}`,
    drag: (degrees) => `Dragging · ∠ ${degrees}`,
  },
  stepOf: (step, total) => `Step ${step} of ${total}`,
  embedStep: (step, total) => `Step ${step} / ${total}`,
  openInStudio: 'Open in Faltstudio ↗',
  allModels: 'All models',
  edit: 'Edit',
  readingAid: 'Reading aid',
  fitCamera: 'Fit camera',
  restart: 'Start over',
  menu: 'Menu',
  viewerNav: 'Viewer',
  embedHint: 'Drag the corner or tap “Next”.',
  aid: {
    grip: 'Grip — drag it',
    axis: 'Fold axis',
    ghost: 'Target (ghost)',
    path: 'Path of the corner',
  },
  loadFailed: 'Tutorial can’t be read',
  loadHttp: (status) => `The file can’t be reached (HTTP ${status}).`,
  loadFormat: (path) =>
    path ? `The file is not a valid tutorial (at “${path}”).` : 'The file is not a valid tutorial.',
  loadOther: (detail) => `The file could not be loaded: ${detail}`,
  loading: 'Loading …',
  doneTitle: 'Done — have a good flight!',
  doneText: 'All steps folded.',
  again: 'Again',
  next: 'Next',
  back: 'Back',
  demonstrate: 'Demonstrate',
  controls: 'Controls',
  progress: 'Progress',
  scene: '3D view of the sheet',
};

/** Viewer-Texte; `msg(locale)` mit der Sprache des Widgets, beim Rendern aufrufen. */
export const msg = messages({ de, en });
