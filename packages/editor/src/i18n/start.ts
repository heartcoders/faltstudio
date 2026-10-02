import { messages } from '@faltstudio/ui';

/** Texte der Startseite: Faecher, leerer Zustand, Modellmenue und „Womit faengst du an?“. */
interface StartMessages {
  readonly pageTitle: string;
  readonly modelCount: (count: string) => string;
  readonly fileActions: string;
  readonly openFile: string;
  readonly newShort: string;
  readonly newModel: string;
  readonly watermarkMobile: string;
  readonly models: string;
  readonly actions: string;
  readonly newSheet: string;
  readonly patternOf: (title: string) => string;
  readonly more: string;
  readonly moreAbout: (title: string) => string;
  readonly create: string;
  readonly edit: string;
  readonly editCopy: string;
  readonly exampleBadge: string;
  readonly fromPhoto: string;
  readonly open: string;
  readonly fileUnreadable: (reason: string) => string;
  readonly status: {
    readonly errors: (count: number) => string;
    readonly draft: string;
    readonly checked: string;
    readonly errorLabel: (count: number) => string;
  };
  readonly info: {
    readonly kicker: (number: string, total: string, status: string) => string;
    readonly damaged: string;
    readonly newKicker: string;
    readonly newMeta: string;
    readonly exampleKicker: (number: string, total: string) => string;
  };
  readonly empty: {
    readonly titleFirst: string;
    readonly titleSecond: string;
    readonly lead: string;
    readonly firstFirst: string;
    readonly firstSecond: string;
    readonly example: string;
  };
  readonly overlay: {
    readonly viewGuide: string;
    readonly share: string;
    readonly shareQr: string;
    readonly delete: string;
    readonly deleteHeading: string;
    readonly deleteConfirm: string;
    readonly changed: (date: string) => string;
    readonly deleteText: (steps: string) => string;
    readonly shareDamaged: string;
  };
  readonly picker: {
    readonly backToOverview: string;
    readonly head: string;
    readonly titleFirst: string;
    readonly titleSecond: string;
    readonly startKind: string;
    readonly format: string;
    readonly custom: string;
    readonly example: string;
    readonly examplePattern: string;
    readonly photoArt: string;
    readonly options: {
      readonly blank: OptionMessages;
      readonly photo: OptionMessages;
      readonly example: OptionMessages;
    };
  };
}

interface OptionMessages {
  readonly title: string;
  readonly text: string;
  readonly action: string;
}

const de: StartMessages = {
  pageTitle: 'Faltstudio · Meine Modelle',
  modelCount: (count) => `${count} Modelle`,
  fileActions: 'Datei',
  openFile: 'Datei öffnen',
  newShort: 'Neu',
  newModel: 'Neues Modell',
  watermarkMobile: 'Falten',
  models: 'Modelle',
  actions: 'Aktionen',
  newSheet: 'Neues Blatt',
  patternOf: (title) => `Faltmuster ${title}`,
  more: 'Mehr ⋯',
  moreAbout: (title) => `Mehr zu ${title}`,
  create: 'Anlegen',
  edit: 'Bearbeiten',
  editCopy: 'Als Kopie bearbeiten',
  exampleBadge: 'Beispiel',
  fromPhoto: 'Aus Foto',
  open: 'Öffnen ↗',
  fileUnreadable: (reason) => `Datei nicht lesbar: ${reason}`,
  status: {
    errors: (count) => `${count} Fehler`,
    draft: 'Entwurf',
    checked: 'Geprüft',
    errorLabel: (count) => `× ${count} Fehler`,
  },
  info: {
    kicker: (number, total, status) => `Modell ${number} / ${total} · ${status}`,
    damaged: 'Datei beschädigt',
    newKicker: 'Neues Blatt · A4 210 × 297',
    newMeta: 'Leer · Foto oder zeichnen',
    exampleKicker: (number, total) => `Beispiel ${number} / ${total} · öffnet als Kopie`,
  },
  empty: {
    titleFirst: 'Noch nichts',
    titleSecond: 'gefaltet.',
    lead: 'Lege dein erstes Blatt auf den Tisch, leer oder als Foto eines entfalteten Fliegers.',
    firstFirst: 'Erstes',
    firstSecond: 'Modell',
    example: 'Oder: Beispiel als Kopie öffnen',
  },
  overlay: {
    viewGuide: 'Anleitung ansehen',
    share: 'Teilen',
    shareQr: 'Teilen · QR-Code',
    delete: 'Löschen …',
    deleteHeading: '! Löschen bestätigen',
    deleteConfirm: '× Löschen',
    changed: (date) => `geändert ${date}`,
    deleteText: (steps) => `Das Modell mit ${steps} wird aus diesem Browser entfernt.`,
    shareDamaged: 'Datei beschädigt, Teilen nicht möglich.',
  },
  picker: {
    backToOverview: 'Zurück zur Übersicht',
    head: 'Neues Blatt',
    titleFirst: 'Womit fängst',
    titleSecond: 'du an?',
    startKind: 'Startart',
    format: 'Format',
    custom: 'Eigen',
    example: 'Beispiel',
    examplePattern: 'Faltmuster Beispiel',
    photoArt: 'Foto',
    options: {
      blank: {
        title: 'Leeres Blatt',
        text: 'Faltlinien selbst zeichnen, mit Raster und Einrasten.',
        action: 'Leeres Blatt öffnen',
      },
      photo: {
        title: 'Aus Foto',
        text: 'Ein entfaltetes Blatt fotografieren und die Linien nachziehen.',
        action: 'Kamera öffnen',
      },
      example: {
        title: 'Beispiel kopieren',
        text: 'Mit einem fertigen Flieger starten und ihn abwandeln.',
        action: 'Beispiel öffnen',
      },
    },
  },
};

const en: StartMessages = {
  pageTitle: 'Faltstudio · My models',
  modelCount: (count) => `${count} models`,
  fileActions: 'File',
  openFile: 'Open file',
  newShort: 'New',
  newModel: 'New model',
  watermarkMobile: 'Fold',
  models: 'Models',
  actions: 'Actions',
  newSheet: 'New sheet',
  patternOf: (title) => `Crease pattern ${title}`,
  more: 'More ⋯',
  moreAbout: (title) => `More about ${title}`,
  create: 'Create',
  edit: 'Edit',
  editCopy: 'Edit a copy',
  exampleBadge: 'Example',
  fromPhoto: 'From photo',
  open: 'Open ↗',
  fileUnreadable: (reason) => `Can't read file: ${reason}`,
  status: {
    errors: (count) => `${count} ${count === 1 ? 'error' : 'errors'}`,
    draft: 'Draft',
    checked: 'Checked',
    errorLabel: (count) => `× ${count} ${count === 1 ? 'error' : 'errors'}`,
  },
  info: {
    kicker: (number, total, status) => `Model ${number} / ${total} · ${status}`,
    damaged: 'File damaged',
    newKicker: 'New sheet · A4 210 × 297',
    newMeta: 'Blank · photo or draw',
    exampleKicker: (number, total) => `Example ${number} / ${total} · opens as a copy`,
  },
  empty: {
    titleFirst: 'Nothing',
    titleSecond: 'folded yet.',
    lead: 'Put your first sheet on the table, blank or as a photo of an unfolded plane.',
    firstFirst: 'First',
    firstSecond: 'model',
    example: 'Or: open an example as a copy',
  },
  overlay: {
    viewGuide: 'View instructions',
    share: 'Share',
    shareQr: 'Share · QR code',
    delete: 'Delete …',
    deleteHeading: '! Confirm delete',
    deleteConfirm: '× Delete',
    changed: (date) => `changed ${date}`,
    deleteText: (steps) => `The model with ${steps} will be removed from this browser.`,
    shareDamaged: "File damaged, can't share.",
  },
  picker: {
    backToOverview: 'Back to overview',
    head: 'New sheet',
    titleFirst: 'How do you',
    titleSecond: 'want to start?',
    startKind: 'How to start',
    format: 'Format',
    custom: 'Custom',
    example: 'Example',
    examplePattern: 'Example crease pattern',
    photoArt: 'Photo',
    options: {
      blank: {
        title: 'Blank sheet',
        text: 'Draw the creases yourself, with grid and snapping.',
        action: 'Open blank sheet',
      },
      photo: {
        title: 'From photo',
        text: 'Take a photo of an unfolded sheet and trace the lines.',
        action: 'Open camera',
      },
      example: {
        title: 'Copy an example',
        text: 'Start with a finished plane and adapt it.',
        action: 'Open example',
      },
    },
  },
};

/** Texte der Startseite in der aktuellen Sprache; beim Rendern aufrufen. */
export const startText = messages({ de, en });
