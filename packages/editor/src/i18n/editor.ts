import { messages } from '@faltstudio/ui';
import type { SnapKind } from '@faltstudio/core';
import type { EditorMode } from '../components/editor-app/modes.js';
import type { DrawKind, SnapSettings, Tool } from '../state/editor-state.js';

type FileEntry = 'done' | 'new' | 'open' | 'save' | 'export' | 'embed' | 'share';

/**
 * Texte des Editor-Rahmens (Kopf, Datei-Menue, Statuszeile), des Linien- und
 * des Foto-Modus und der Editor-Meldungen. Schritte, Vorschau und Befunde
 * haben ein eigenes Woerterbuch.
 */
interface EditorMessages {
  readonly modes: Readonly<Record<EditorMode, string>>;
  readonly modesLabel: string;
  readonly backToOverview: string;
  readonly fileMenuButton: string;
  readonly done: string;
  readonly issues: string;
  readonly issuesLabel: (errors: number, warnings: number) => string;
  readonly savedDraft: (time: string) => string;
  readonly notSaved: string;
  readonly language: string;
  readonly file: {
    readonly title: string;
    readonly menuHead: string;
    readonly commandCount: (count: number) => string;
    readonly labels: Readonly<Record<FileEntry, string>>;
    readonly menuLabels: Readonly<Record<Exclude<FileEntry, 'done'>, string>>;
    readonly notes: Readonly<Record<FileEntry, string>>;
  };
  readonly status: {
    readonly stepOf: (step: string, total: string) => string;
    readonly axis: (creases: string, kind: string, angle: string) => string;
    readonly stepsWithIssues: (count: number) => string;
    readonly noPhoto: string;
    readonly handleActive: (handle: number) => string;
    readonly opacity: (percent: number) => string;
  };
  readonly messages: {
    readonly embedCopied: string;
    readonly openFailed: (reason: string) => string;
    readonly photoUnreadable: (reason: string) => string;
    readonly newSheet: (format: string) => string;
    readonly fileOpened: string;
    readonly modelOpened: string;
    readonly modelBroken: string;
    readonly modelNotFound: string;
    readonly exampleCopied: string;
    readonly copySuffix: string;
    readonly sharedSaved: string;
    readonly linkUnreadable: (reason: string) => string;
    readonly photoLoaded: (width: number, height: number) => string;
    readonly formatLocked: string;
    readonly notSaved: (reason: string) => string;
    readonly imageUnreadable: string;
    readonly canvasMissing: string;
    readonly storageMissing: string;
    readonly storageFailed: string;
  };
  readonly tools: {
    readonly nav: string;
    readonly tool: string;
    readonly kind: string;
    readonly aids: string;
    readonly labels: Readonly<Record<Tool, string>>;
    readonly hints: Readonly<Record<Tool, string>>;
    readonly symmetry: string;
    readonly symmetryShort: string;
    readonly snapping: string;
    readonly snapTo: string;
    readonly targets: Readonly<Record<keyof SnapSettings, string>>;
    readonly on: string;
    readonly off: string;
  };
  readonly lines: {
    readonly tap: (step: number) => string;
    readonly tapStart: string;
    readonly tapEnd: string;
    readonly open3d: string;
    readonly backToSheet: string;
    readonly snapTargets: Readonly<Record<keyof SnapSettings, string>>;
    readonly snapNotes: Readonly<Record<keyof SnapSettings, string>>;
    readonly axisY: string;
    readonly legend: string;
    readonly snapPoint: string;
    readonly selection: string;
    readonly pieces: (count: number) => string;
    readonly wholeLine: string;
    readonly delete: string;
    readonly kindToggle: (kind: string) => string;
    readonly undo: string;
    readonly redo: string;
    readonly wholeSheet: string;
    readonly sceneLabel: string;
  };
  readonly readout: {
    readonly snaps: Readonly<Record<SnapKind, string>>;
  };
  readonly canvas: {
    readonly pattern: string;
    readonly symmetryAxis: string;
    readonly snapped: string;
    readonly free: string;
    readonly collinear: (id: string) => string;
  };
  readonly kindHelp: {
    readonly question: (kinds: string) => string;
    readonly texts: Readonly<Record<DrawKind, string>>;
  };
  readonly photo: {
    readonly title: string;
    readonly align: string;
    readonly choose: string;
    readonly camera: string;
    readonly file: string;
    readonly replace: string;
    readonly load: string;
    readonly remove: string;
    readonly loadPhoto: string;
    readonly emptyCaption: string;
    readonly emptyHint: string;
    readonly opacity: string;
    readonly opacityHeading: (percent: number) => string;
    readonly sheet: string;
    readonly sheetFormat: string;
    readonly format: string;
    readonly letter: string;
    readonly keys: string;
    readonly apply: string;
    readonly viewLabel: string;
    readonly loupe: (handle: string) => string;
    readonly swapped: string;
    readonly checks: (skew: string, ratio: string, target: string, size: string) => string;
  };
  readonly model3d: string;
}

const de: EditorMessages = {
  modes: { photo: 'Foto', lines: 'Linien', steps: 'Schritte', preview: 'Vorschau' },
  modesLabel: 'Arbeitsmodus',
  backToOverview: 'Zur Übersicht',
  fileMenuButton: 'Datei-Menü',
  done: 'Fertig',
  issues: 'Befunde',
  issuesLabel: (errors, warnings) =>
    errors + warnings === 0
      ? 'Befunde: keine'
      : `Befunde: ${errors} Fehler, ${warnings} ${warnings === 1 ? 'Warnung' : 'Warnungen'}`,
  savedDraft: (time) => `Entwurf · gespeichert ${time}`,
  notSaved: 'Nicht gespeichert',
  language: 'Sprache · Language',
  file: {
    title: 'Datei',
    menuHead: 'M1 · Datei',
    commandCount: (count) => `${count} Befehle`,
    labels: {
      done: 'Fertig · Teilen',
      new: 'Neu',
      open: 'Öffnen …',
      save: 'Speichern · JSON',
      export: 'Export · .fold',
      embed: 'Einbett-Code',
      share: 'Teilen',
    },
    menuLabels: {
      new: 'Neu',
      open: 'Öffnen …',
      save: 'Speichern · JSON',
      export: 'Export · .fold',
      embed: 'Einbett-Code kopieren',
      share: 'Teilen · QR-Code',
    },
    notes: {
      done: 'Abschluss',
      new: 'Leeres Blatt',
      open: '.json',
      save: 'Download',
      export: 'FOLD 1.1',
      embed: 'Kopieren',
      share: 'QR-Code',
    },
  },
  status: {
    stepOf: (step, total) => `Schritt ${step} von ${total}`,
    axis: (creases, kind, angle) => `Achse ${creases} · ${kind} · ∠${angle}°`,
    stepsWithIssues: (count) => `${count} ${count === 1 ? 'Schritt' : 'Schritte'} mit Befund`,
    noPhoto: 'Kein Foto',
    handleActive: (handle) => `Griff P${handle} aktiv`,
    opacity: (percent) => `Deckkraft ${percent} %`,
  },
  messages: {
    embedCopied: 'Einbett-Code kopiert',
    openFailed: (reason) => `Öffnen fehlgeschlagen: ${reason}`,
    photoUnreadable: (reason) => `Foto nicht lesbar: ${reason}`,
    newSheet: (format) => `Neues Blatt ${format}`,
    fileOpened: 'Datei geöffnet',
    modelOpened: 'Modell geöffnet',
    modelBroken: 'Modell beschädigt – neues Blatt',
    modelNotFound: 'Modell nicht gefunden – neues Blatt',
    exampleCopied: 'Beispiel als Kopie geöffnet',
    copySuffix: 'Kopie',
    sharedSaved: 'Geteiltes Modell als Kopie gespeichert',
    linkUnreadable: (reason) => `Link nicht lesbar (${reason}) – neues Blatt`,
    photoLoaded: (width, height) => `Foto ${width} × ${height} px geladen`,
    formatLocked: 'Format nur auf leerem Blatt änderbar',
    notSaved: (reason) => `Nicht gespeichert: ${reason}`,
    imageUnreadable: 'Bild lässt sich nicht lesen.',
    canvasMissing: 'Canvas 2D nicht verfügbar.',
    storageMissing: 'Browser-Speicher (IndexedDB) nicht verfügbar.',
    storageFailed: 'Browser-Speicher-Anfrage fehlgeschlagen.',
  },
  tools: {
    nav: 'Werkzeuge',
    tool: 'Werkzeug',
    kind: 'Faltart',
    aids: 'Hilfen',
    labels: { select: 'Auswahl', line: 'Linie', measure: 'Messen' },
    hints: {
      select: 'Klick wählt ein Stück, Alt+Klick die ganze Linie, Shift erweitert. Entf löscht.',
      line: 'Zwei Klicks: Start und Ende. Rastet auf Ecken, Mitten, Kanten und 22,5°-Winkel.',
      measure: 'Zwei Klicks messen Länge und Winkel, ohne etwas zu zeichnen.',
    },
    symmetry: 'Symmetrie',
    symmetryShort: 'Sym',
    snapping: 'Einrasten',
    snapTo: 'Einrasten auf',
    targets: { vertices: 'Ecken', midpoints: 'Mitten', intersections: 'Schnitt', grid: 'Raster' },
    on: 'An',
    off: 'Aus',
  },
  lines: {
    tap: (step) => `Tipp ${step} / 2`,
    tapStart: 'Startpunkt tippen',
    tapEnd: 'Start ✓ · Endpunkt tippen',
    open3d: '3D öffnen',
    backToSheet: 'Zurück zum Blatt',
    snapTargets: {
      vertices: 'Ecken',
      midpoints: 'Mitten',
      intersections: 'Schnittpunkte',
      grid: 'Raster',
    },
    snapNotes: {
      vertices: 'Knoten',
      midpoints: 'Kanten + Linien',
      intersections: 'Kanten',
      grid: '5 mm',
    },
    axisY: 'Achse Y',
    legend: 'Legende',
    snapPoint: 'Einrastpunkt',
    selection: 'Auswahl',
    pieces: (count) => `${count} Stücke`,
    wholeLine: 'Ganze Linie',
    delete: '× Löschen',
    kindToggle: (kind) => `Faltart ${kind}, tippen wechselt`,
    undo: 'Rückgängig',
    redo: 'Wiederholen',
    wholeSheet: 'Ganzes Blatt',
    sceneLabel: '3D · Flach · Ziehen zum Drehen',
  },
  readout: {
    snaps: {
      vertex: 'Ecke',
      midpoint: 'Mitte',
      intersection: 'Schnitt',
      edge: 'Kante',
      angle: 'Winkel',
      grid: 'Raster',
      free: 'frei',
    },
  },
  canvas: {
    pattern: 'Faltmuster',
    symmetryAxis: 'Symmetrieachse Y',
    snapped: 'Eingerastet',
    free: 'Frei',
    collinear: (id) => `+ ${id} kollinear`,
  },
  kindHelp: {
    question: (kinds) => `Was heißt ${kinds}?`,
    texts: {
      valley:
        'Zu dir hin falten. Die Falte liegt unten wie ein Tal (V), das Papier öffnet sich zu dir.',
      mountain:
        'Von dir weg falten. Die Falte steht oben wie ein Bergrücken (Λ). Von der Rückseite gesehen ist sie ein Tal.',
      flat: 'Hilfslinie, wird nicht gefaltet. Zum Ausrichten und Messen.',
    },
  },
  photo: {
    title: 'Foto',
    align: 'Foto ausrichten',
    choose: 'Foto wählen',
    camera: 'Kamera',
    file: 'Datei',
    replace: 'Ersetzen',
    load: 'Laden',
    remove: 'Entfernen',
    loadPhoto: 'Foto laden',
    emptyCaption: 'Foto des entfalteten Blatts, möglichst von oben',
    emptyHint: 'Entfaltetes Blatt möglichst von oben fotografieren.',
    opacity: 'Deckkraft',
    opacityHeading: (percent) => `Deckkraft · ${percent} %`,
    sheet: 'Blatt',
    sheetFormat: 'Blattformat',
    format: 'Format',
    letter: 'Letter',
    keys: 'Griff ziehen · Tab nächster Griff · Pfeile 1 px, mit Shift 10 px',
    apply: 'Als Vorlage nutzen',
    viewLabel:
      'Foto mit vier Entzerrungsgriffen. Tab wählt den nächsten Griff, Pfeiltasten verschieben ihn.',
    loupe: (handle) => `Lupe um ${handle}`,
    swapped: 'Griffe vertauscht – Reihenfolge links oben, rechts oben, rechts unten, links unten.',
    checks: (skew, ratio, target, size) =>
      `Verzerrung ${skew}° · Seiten 1 : ${ratio} (soll ${target}) · ${size} px`,
  },
  model3d: '3D-Modell',
};

const en: EditorMessages = {
  modes: { photo: 'Photo', lines: 'Lines', steps: 'Steps', preview: 'Preview' },
  modesLabel: 'Mode',
  backToOverview: 'Back to overview',
  fileMenuButton: 'File menu',
  done: 'Done',
  issues: 'Issues',
  issuesLabel: (errors, warnings) =>
    errors + warnings === 0
      ? 'Issues: none'
      : `Issues: ${errors} ${errors === 1 ? 'error' : 'errors'}, ${warnings} ${warnings === 1 ? 'warning' : 'warnings'}`,
  savedDraft: (time) => `Draft · saved ${time}`,
  notSaved: 'Not saved',
  language: 'Sprache · Language',
  file: {
    title: 'File',
    menuHead: 'M1 · File',
    commandCount: (count) => `${count} commands`,
    labels: {
      done: 'Done · Share',
      new: 'New',
      open: 'Open …',
      save: 'Save · JSON',
      export: 'Export · .fold',
      embed: 'Embed code',
      share: 'Share',
    },
    menuLabels: {
      new: 'New',
      open: 'Open …',
      save: 'Save · JSON',
      export: 'Export · .fold',
      embed: 'Copy embed code',
      share: 'Share · QR code',
    },
    notes: {
      done: 'Finish',
      new: 'Blank sheet',
      open: '.json',
      save: 'Download',
      export: 'FOLD 1.1',
      embed: 'Copy',
      share: 'QR code',
    },
  },
  status: {
    stepOf: (step, total) => `Step ${step} of ${total}`,
    axis: (creases, kind, angle) => `Axis ${creases} · ${kind} · ∠${angle}°`,
    stepsWithIssues: (count) => `${count} ${count === 1 ? 'step' : 'steps'} with issues`,
    noPhoto: 'No photo',
    handleActive: (handle) => `Handle P${handle} active`,
    opacity: (percent) => `Opacity ${percent} %`,
  },
  messages: {
    embedCopied: 'Embed code copied',
    openFailed: (reason) => `Could not open: ${reason}`,
    photoUnreadable: (reason) => `Could not read photo: ${reason}`,
    newSheet: (format) => `New sheet ${format}`,
    fileOpened: 'File opened',
    modelOpened: 'Model opened',
    modelBroken: 'Model damaged – new sheet',
    modelNotFound: 'Model not found – new sheet',
    exampleCopied: 'Example opened as a copy',
    copySuffix: 'copy',
    sharedSaved: 'Shared model saved as a copy',
    linkUnreadable: (reason) => `Could not read link (${reason}) – new sheet`,
    photoLoaded: (width, height) => `Photo ${width} × ${height} px loaded`,
    formatLocked: 'Format can only change on a blank sheet',
    notSaved: (reason) => `Not saved: ${reason}`,
    imageUnreadable: 'Could not read the image.',
    canvasMissing: 'Canvas 2D is not available.',
    storageMissing: 'Browser storage (IndexedDB) is not available.',
    storageFailed: 'Browser storage request failed.',
  },
  tools: {
    nav: 'Tools',
    tool: 'Tool',
    kind: 'Fold type',
    aids: 'Aids',
    labels: { select: 'Select', line: 'Line', measure: 'Measure' },
    hints: {
      select: 'Click picks a piece, Alt+click the whole line, Shift adds. Delete removes.',
      line: 'Two clicks: start and end. Snaps to corners, midpoints, edges and 22.5° angles.',
      measure: 'Two clicks measure length and angle without drawing anything.',
    },
    symmetry: 'Symmetry',
    symmetryShort: 'Sym',
    snapping: 'Snap',
    snapTo: 'Snap to',
    targets: {
      vertices: 'Corners',
      midpoints: 'Midpoints',
      intersections: 'Crossings',
      grid: 'Grid',
    },
    on: 'On',
    off: 'Off',
  },
  lines: {
    tap: (step) => `Tap ${step} / 2`,
    tapStart: 'Tap the start point',
    tapEnd: 'Start ✓ · tap the end point',
    open3d: 'Open 3D',
    backToSheet: 'Back to the sheet',
    snapTargets: {
      vertices: 'Corners',
      midpoints: 'Midpoints',
      intersections: 'Crossings',
      grid: 'Grid',
    },
    snapNotes: {
      vertices: 'Vertices',
      midpoints: 'Edges + lines',
      intersections: 'Edges',
      grid: '5 mm',
    },
    axisY: 'Axis Y',
    legend: 'Legend',
    snapPoint: 'Snap point',
    selection: 'Selection',
    pieces: (count) => `${count} pieces`,
    wholeLine: 'Whole line',
    delete: '× Delete',
    kindToggle: (kind) => `Fold type ${kind}, tap to change`,
    undo: 'Undo',
    redo: 'Redo',
    wholeSheet: 'Whole sheet',
    sceneLabel: '3D · Flat · Drag to rotate',
  },
  readout: {
    snaps: {
      vertex: 'corner',
      midpoint: 'midpoint',
      intersection: 'crossing',
      edge: 'edge',
      angle: 'angle',
      grid: 'grid',
      free: 'free',
    },
  },
  canvas: {
    pattern: 'Crease pattern',
    symmetryAxis: 'Symmetry axis Y',
    snapped: 'Snapped',
    free: 'Free',
    collinear: (id) => `+ ${id} collinear`,
  },
  kindHelp: {
    question: (kinds) => `What does ${kinds} mean?`,
    texts: {
      valley:
        'Fold towards you. The crease sits at the bottom like a valley (V), the paper opens towards you.',
      mountain:
        'Fold away from you. The crease stands up like a ridge (Λ). Seen from the back it is a valley.',
      flat: 'Guide line, not folded. For aligning and measuring.',
    },
  },
  photo: {
    title: 'Photo',
    align: 'Align photo',
    choose: 'Choose photo',
    camera: 'Camera',
    file: 'File',
    replace: 'Replace',
    load: 'Load',
    remove: 'Remove',
    loadPhoto: 'Load photo',
    emptyCaption: 'Photo of the unfolded sheet, taken from above if possible',
    emptyHint: 'Photograph the unfolded sheet from above if possible.',
    opacity: 'Opacity',
    opacityHeading: (percent) => `Opacity · ${percent} %`,
    sheet: 'Sheet',
    sheetFormat: 'Sheet format',
    format: 'Format',
    letter: 'Letter',
    keys: 'Drag a handle · Tab next handle · arrows 1 px, with Shift 10 px',
    apply: 'Use as template',
    viewLabel:
      'Photo with four perspective handles. Tab picks the next handle, arrow keys move it.',
    loupe: (handle) => `Magnifier around ${handle}`,
    swapped: 'Handles swapped – order is top left, top right, bottom right, bottom left.',
    checks: (skew, ratio, target, size) =>
      `Skew ${skew}° · sides 1 : ${ratio} (target ${target}) · ${size} px`,
  },
  model3d: '3D model',
};

/** Texte des Editors in der aktuellen Sprache; beim Rendern aufrufen. */
export const editorText = messages({ de, en });
