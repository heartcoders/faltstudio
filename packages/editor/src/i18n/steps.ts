import type { FoldError, FoldErrorCode, PatternIssue, PatternIssueCode } from '@faltstudio/core';
import { messages } from '@faltstudio/ui';

/**
 * Texte fuer Schritte, Vorschau, Befunde, Fertig und Teilen sowie die
 * Meldungen aus core, uebersetzt nach Code. Core liefert weiter deutsche
 * `title`/`message` als Rueckfall.
 */
interface StepsMessages {
  readonly steps: {
    readonly newStep: string;
    readonly noSteps: string;
    readonly noStepsYet: string;
    readonly firstStep: string;
    readonly mobileEmpty: string;
    readonly counter: (number: string, total: string) => string;
    readonly stepLabel: (number: string, title: string, failing: boolean) => string;
    readonly diagram: (number: string) => string;
    readonly canvasClick: string;
    readonly canvasTap: string;
    readonly sameLine: string;
    readonly takeAlong: string;
    readonly takeAlongIds: (ids: string) => string;
    readonly play: string;
    readonly progress: string;
    readonly fold: string;
    readonly sequential: string;
    readonly foldLine: string;
    readonly clickLine: string;
    readonly tapLine: string;
    readonly removeId: (id: string) => string;
    readonly addFold: string;
    readonly remove: string;
    readonly movingSide: string;
    readonly side: (letter: string) => string;
    readonly angle: (degrees: string) => string;
    readonly foldKind: string;
    readonly delete: string;
    readonly deleteStep: (number: string) => string;
    readonly titleLabel: string;
    readonly titleOfStep: (number: string) => string;
    readonly hint: string;
    readonly notFoldable: string;
    readonly sequence: string;
    readonly addStep: string;
    readonly view: string;
    readonly editStep: string;
  };
  readonly preview: {
    readonly finished: string;
    readonly camera: string;
    readonly cameraIso: string;
    readonly cameraTop: string;
    readonly cameraSide: string;
    readonly cameraFront: string;
    readonly timeline: string;
    readonly stepBack: string;
    readonly stepForward: string;
    readonly play: string;
    readonly pause: string;
    readonly playMobile: string;
    readonly tempo: string;
    readonly tempoCycle: (tempo: string) => string;
  };
  readonly issues: {
    readonly heading: string;
    readonly error: string;
    readonly warning: string;
    readonly showOnSheet: string;
    readonly adoptAll: string;
    readonly adoptAllKinds: string;
    readonly adoptAllShort: string;
    readonly passed: (count: number) => string;
    readonly none: string;
    readonly noneShort: string;
    readonly countsLabel: (errors: number, warnings: number) => string;
    readonly kindsDiffer: (count: number) => { readonly subject: string; readonly rest: string };
    readonly kindTitle: (id: string) => string;
    readonly kindMessage: (stored: string, folded: string) => string;
  };
  readonly done: {
    readonly title: string;
    readonly share: string;
    readonly name: string;
    readonly errors: (count: number) => string;
    readonly foldable: string;
    readonly viewGuide: string;
    readonly shareQr: string;
    readonly toOverview: string;
  };
  readonly share: {
    readonly tooLarge: string;
    readonly qrLabel: string;
    readonly note: string;
    readonly copy: string;
    readonly copied: string;
    readonly copiedStatus: string;
    readonly shareNative: string;
    readonly fallbackTitle: string;
    readonly copyDenied: (reason: string) => string;
    readonly failed: (reason: string) => string;
  };
  readonly pattern: Readonly<
    Record<
      PatternIssueCode,
      { readonly title: (subject: string) => string; readonly message: (value: number) => string }
    >
  >;
  readonly foldErrors: Readonly<Record<FoldErrorCode, string>>;
}

const de: StepsMessages = {
  steps: {
    newStep: 'Neuer Schritt',
    noSteps: 'Keine Schritte',
    noStepsYet: 'Noch keine Schritte',
    firstStep: '+ Erster Schritt',
    mobileEmpty: 'Noch keine Schritte. „+“ legt den ersten an.',
    counter: (number, total) => `Schritt ${number} / ${total}`,
    stepLabel: (number, title, failing) =>
      `Schritt ${number}: ${title}${failing ? ', nicht faltbar' : ''}`,
    diagram: (number) => `Diagramm Schritt ${number}`,
    canvasClick: 'Faltmuster: Segmente für den Schritt anklicken',
    canvasTap: 'Faltmuster: Segmente für den Schritt antippen',
    sameLine: 'Liegt auf derselben Linie:',
    takeAlong: 'Mitnehmen',
    takeAlongIds: (ids) => `+ ${ids} mitnehmen`,
    play: 'Schritt abspielen',
    progress: 'Fortschritt der Faltung',
    fold: 'Faltung',
    sequential: 'Nacheinander',
    foldLine: 'Faltlinie',
    clickLine: 'Linie in der Zeichnung anklicken.',
    tapLine: 'Linie oben antippen.',
    removeId: (id) => `${id} entfernen`,
    addFold: '+ Faltung',
    remove: 'Entfernen',
    movingSide: 'Bewegliche Seite',
    side: (letter) => `Seite ${letter}`,
    angle: (degrees) => `Winkel · ${degrees}°`,
    foldKind: 'Faltart',
    delete: 'Löschen',
    deleteStep: (number) => `Schritt ${number} löschen`,
    titleLabel: 'Titel',
    titleOfStep: (number) => `Titel Schritt ${number}`,
    hint: 'Hinweis',
    notFoldable: 'Nicht faltbar',
    sequence: 'Schrittfolge',
    addStep: 'Schritt hinzufügen',
    view: 'Ansicht',
    editStep: 'Schritt bearbeiten',
  },
  preview: {
    finished: 'Fertig',
    camera: 'Kamera',
    cameraIso: 'Iso',
    cameraTop: 'Oben',
    cameraSide: 'Seite',
    cameraFront: 'Vorne',
    timeline: 'Zeitleiste',
    stepBack: 'Schritt zurück',
    stepForward: 'Schritt vor',
    play: '▶ Abspielen',
    pause: '❚❚ Pause',
    playMobile: 'Abspielen',
    tempo: 'Tempo',
    tempoCycle: (tempo) => `Tempo ${tempo}×, tippen wechselt`,
  },
  issues: {
    heading: 'Befunde',
    error: 'Fehler',
    warning: 'Warnung',
    showOnSheet: 'Auf dem Blatt zeigen',
    adoptAll: 'Alle Vorschläge übernehmen',
    adoptAllKinds: 'Alle Arten übernehmen',
    adoptAllShort: 'Alle übernehmen',
    passed: (count) => `✓ ${count} ${count === 1 ? 'Prüfung' : 'Prüfungen'} bestanden`,
    none: 'Muster, Linienarten und Schritte ohne Befund',
    noneShort: '✓ Ohne Befund',
    countsLabel: (errors, warnings) => `Alle Befunde: ${errors} Fehler, ${warnings} Warnungen`,
    kindsDiffer: (count) => ({
      subject: `${count} Linienarten`,
      rest: 'weichen von den Schritten ab',
    }),
    kindTitle: (id) => `Art · ${id}`,
    kindMessage: (stored, folded) => `Gespeichert ${stored}, in den Schritten ${folded}`,
  },
  done: {
    title: 'Fertig',
    share: 'Teilen',
    name: 'Name',
    errors: (count) => `× ${count} Fehler`,
    foldable: 'Faltbar',
    viewGuide: 'Anleitung ansehen',
    shareQr: 'Teilen · QR-Code',
    toOverview: 'Zur Übersicht',
  },
  share: {
    tooLarge: 'Zu groß für einen QR-Code. Der Link funktioniert trotzdem.',
    qrLabel: 'QR-Code mit dem Link zur Anleitung',
    note: 'Mit dem Handy scannen · Link enthält das ganze Modell, ohne Foto',
    copy: 'Link kopieren',
    copied: '✓ Kopiert',
    copiedStatus: 'Link kopiert',
    shareNative: 'Teilen …',
    fallbackTitle: 'Faltanleitung',
    copyDenied: (reason) => `Kopieren nicht erlaubt: ${reason}`,
    failed: (reason) => `Link nicht erstellt: ${reason}`,
  },
  pattern: {
    maekawa: {
      title: (vertex) => `Maekawa · ${vertex}`,
      message: (value) => `|B − T| = ${value} — erwartet 2`,
    },
    kawasaki: {
      title: (vertex) => `Kawasaki · ${vertex}`,
      message: (value) => `Σ ungerade Winkel ${value.toFixed(1)}° — erwartet 180.0°`,
    },
    outside: {
      title: (crease) => `${crease} außerhalb`,
      message: () => 'Liegt nicht vollständig auf dem Blatt',
    },
    short: {
      title: (crease) => `${crease} sehr kurz`,
      message: () => 'Kürzer als 0,5 mm, vermutlich ein Versehen',
    },
    dangling: {
      title: (crease) => `${crease} offen`,
      message: () => 'Endet frei und begrenzt keine Fläche',
    },
  },
  foldErrors: {
    'unknown-crease': 'Die Faltung nennt unbekannte Linien.',
    'no-crease': 'Die Faltung hat keine Linie.',
    'point-outside': 'Der Punkt der beweglichen Seite liegt nicht auf dem Blatt.',
    'point-on-crease': 'Der Punkt der beweglichen Seite liegt auf einer Linie.',
    'not-collinear': 'Die Segmente liegen im aktuellen Zustand nicht auf einer Geraden.',
    'no-moving-side': 'Die Linien trennen das Blatt nicht in zwei Seiten.',
    'everything-moves': 'Keine Linie trennt bewegliche und liegende Seite.',
  },
};

const en: StepsMessages = {
  steps: {
    newStep: 'New step',
    noSteps: 'No steps',
    noStepsYet: 'No steps yet',
    firstStep: '+ First step',
    mobileEmpty: 'No steps yet. “+” adds the first one.',
    counter: (number, total) => `Step ${number} / ${total}`,
    stepLabel: (number, title, failing) =>
      `Step ${number}: ${title}${failing ? ', cannot be folded' : ''}`,
    diagram: (number) => `Diagram step ${number}`,
    canvasClick: 'Crease pattern: click segments for this step',
    canvasTap: 'Crease pattern: tap segments for this step',
    sameLine: 'On the same line:',
    takeAlong: 'Include',
    takeAlongIds: (ids) => `+ Include ${ids}`,
    play: 'Play step',
    progress: 'Fold progress',
    fold: 'Fold',
    sequential: 'One after another',
    foldLine: 'Fold line',
    clickLine: 'Click a line in the drawing.',
    tapLine: 'Tap a line above.',
    removeId: (id) => `Remove ${id}`,
    addFold: '+ Fold',
    remove: 'Remove',
    movingSide: 'Moving side',
    side: (letter) => `Side ${letter}`,
    angle: (degrees) => `Angle · ${degrees}°`,
    foldKind: 'Fold type',
    delete: 'Delete',
    deleteStep: (number) => `Delete step ${number}`,
    titleLabel: 'Title',
    titleOfStep: (number) => `Title of step ${number}`,
    hint: 'Note',
    notFoldable: 'Cannot be folded',
    sequence: 'Step sequence',
    addStep: 'Add step',
    view: 'View',
    editStep: 'Edit step',
  },
  preview: {
    finished: 'Done',
    camera: 'Camera',
    cameraIso: 'Iso',
    cameraTop: 'Top',
    cameraSide: 'Side',
    cameraFront: 'Front',
    timeline: 'Timeline',
    stepBack: 'Previous step',
    stepForward: 'Next step',
    play: '▶ Play',
    pause: '❚❚ Pause',
    playMobile: 'Play',
    tempo: 'Speed',
    tempoCycle: (tempo) => `Speed ${tempo}×, tap to change`,
  },
  issues: {
    heading: 'Findings',
    error: 'Error',
    warning: 'Warning',
    showOnSheet: 'Show on sheet',
    adoptAll: 'Apply all suggestions',
    adoptAllKinds: 'Apply all types',
    adoptAllShort: 'Apply all',
    passed: (count) => `✓ ${count} ${count === 1 ? 'check' : 'checks'} passed`,
    none: 'Pattern, line types and steps are fine',
    noneShort: '✓ No findings',
    countsLabel: (errors, warnings) =>
      `All findings: ${errors} ${errors === 1 ? 'error' : 'errors'}, ${warnings} ${warnings === 1 ? 'warning' : 'warnings'}`,
    kindsDiffer: (count) => ({ subject: `${count} line types`, rest: 'differ from the steps' }),
    kindTitle: (id) => `Type · ${id}`,
    kindMessage: (stored, folded) => `Saved as ${stored}, folded as ${folded} in the steps`,
  },
  done: {
    title: 'Done',
    share: 'Share',
    name: 'Name',
    errors: (count) => `× ${count} ${count === 1 ? 'error' : 'errors'}`,
    foldable: 'Foldable',
    viewGuide: 'View instructions',
    shareQr: 'Share · QR code',
    toOverview: 'Back to overview',
  },
  share: {
    tooLarge: 'Too large for a QR code. The link still works.',
    qrLabel: 'QR code with the link to the instructions',
    note: 'Scan with your phone · the link holds the whole model, without the photo',
    copy: 'Copy link',
    copied: '✓ Copied',
    copiedStatus: 'Link copied',
    shareNative: 'Share …',
    fallbackTitle: 'Folding instructions',
    copyDenied: (reason) => `Copying not allowed: ${reason}`,
    failed: (reason) => `Could not create link: ${reason}`,
  },
  pattern: {
    maekawa: {
      title: (vertex) => `Maekawa · ${vertex}`,
      message: (value) => `|M − V| = ${value} — expected 2`,
    },
    kawasaki: {
      title: (vertex) => `Kawasaki · ${vertex}`,
      message: (value) => `Σ alternate angles ${value.toFixed(1)}° — expected 180.0°`,
    },
    outside: {
      title: (crease) => `${crease} outside`,
      message: () => 'Not fully on the sheet',
    },
    short: {
      title: (crease) => `${crease} very short`,
      message: () => 'Shorter than 0.5 mm, probably a slip',
    },
    dangling: {
      title: (crease) => `${crease} loose`,
      message: () => 'Ends freely and bounds no area',
    },
  },
  foldErrors: {
    'unknown-crease': 'The fold names unknown lines.',
    'no-crease': 'The fold has no line.',
    'point-outside': 'The point on the moving side is not on the sheet.',
    'point-on-crease': 'The point on the moving side lies on a line.',
    'not-collinear': 'The segments are not on one straight line in the current state.',
    'no-moving-side': 'The lines do not split the sheet into two sides.',
    'everything-moves': 'No line separates the moving side from the resting side.',
  },
};

/** Texte fuer Schritte, Vorschau, Befunde, Fertig und Teilen; beim Rendern aufrufen. */
export const stepsText = messages({ de, en });

/**
 * Titel und Text eines Muster-Befunds aus core in der aktuellen Sprache.
 *
 * @param issue - Befund aus `checkFlatFoldability` oder `checkLines`.
 * @returns Uebersetzte Texte; ohne passende Werte die Texte aus core.
 */
export function patternIssueText(issue: PatternIssue): {
  readonly title: string;
  readonly message: string;
} {
  const entry = stepsText().pattern[issue.code];
  const subject = issue.vertexId ?? issue.creaseIds?.[0];
  if (!subject) return { title: issue.title, message: issue.message };
  const vertexIssue = issue.code === 'maekawa' || issue.code === 'kawasaki';
  if (vertexIssue && issue.value === undefined)
    return { title: entry.title(subject), message: issue.message };
  return { title: entry.title(subject), message: entry.message(issue.value ?? 0) };
}

/**
 * Warum sich ein Schritt nicht falten laesst, in der aktuellen Sprache.
 *
 * @param error - Faltfehler aus core.
 * @returns Uebersetzter Text, betroffene Linien angehaengt.
 */
export function foldErrorText(error: FoldError): string {
  const text = stepsText().foldErrors[error.code] ?? error.message;
  return error.creaseIds?.length ? `${text} (${error.creaseIds.join(', ')})` : text;
}
