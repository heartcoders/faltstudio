/**
 * Quelldaten eines Tutorials, genau so wie sie in der JSON-Datei stehen.
 * Flaechen und 3D-Zustaende sind abgeleitet und werden beim Laden neu berechnet.
 */

export const FORMAT_VERSION = 1;

export const CREASE_KINDS = ['border', 'mountain', 'valley', 'flat'] as const;
export type CreaseKind = (typeof CREASE_KINDS)[number];

export type VertexId = string;
export type CreaseId = string;
export type FaceId = string;
export type StepId = string;

/** Blattmasse in mm. Ursprung links unten, Blatt liegt in der Ebene z = 0. */
export interface Sheet {
  readonly width: number;
  readonly height: number;
}

export interface Vertex {
  readonly id: VertexId;
  readonly x: number;
  readonly y: number;
}

/** Ein atomares Segment zwischen zwei Vertices. `kind` ist der Endzustand fuer den FOLD-Export. */
export interface Crease {
  readonly id: CreaseId;
  readonly a: VertexId;
  readonly b: VertexId;
  readonly kind: CreaseKind;
}

/**
 * Eine Rotation der beweglichen Seite um die aktuelle Lage der Crease-Segmente.
 * Die Achse wird nicht gespeichert, sondern aus dem Faltzustand berechnet.
 *
 * `angle` in Grad, relativ zur Vorderseite der Flaeche, die liegen bleibt:
 * positiv = Tal (bewegliche Seite kommt nach vorn), negativ = Berg.
 *
 * `movingPoint` ist ein Punkt im flachen Blatt (mm), der auf der beweglichen
 * Seite liegt. Anders als eine Flaechen-ID uebersteht er das Nachbearbeiten
 * von Linien: die bewegliche Flaeche ist die, die den Punkt enthaelt.
 */
export interface Fold {
  readonly creaseIds: readonly CreaseId[];
  readonly movingPoint: readonly [number, number];
  readonly angle: number;
}

export interface LayerHint {
  readonly faceId: FaceId;
  readonly above: FaceId;
}

export interface CameraPose {
  readonly position: readonly [number, number, number];
  readonly target: readonly [number, number, number];
}

export interface Step {
  readonly id: StepId;
  readonly title: string;
  readonly text: string;
  readonly folds: readonly Fold[];
  /**
   * Faltungen nacheinander statt gleichzeitig, z.B. "vorfalten" als Falten und
   * Wiederoeffnen derselben Linie. Standard: gleichzeitig (beide Fluegel).
   */
  readonly sequential?: boolean;
  readonly layerHints?: readonly LayerHint[];
  readonly camera?: CameraPose;
}

/**
 * Foto-Vorlage, nur fuer den Editor. Der Viewer ignoriert dieses Feld.
 * `corners` sind die Griffe P1 bis P4 (links oben, rechts oben, rechts unten,
 * links unten) in Bildpixeln; `size` ist die Bildgroesse in Pixeln.
 */
export interface Reference {
  readonly imageDataUrl: string;
  readonly size: readonly [number, number];
  readonly corners: readonly [
    readonly [number, number],
    readonly [number, number],
    readonly [number, number],
    readonly [number, number],
  ];
  readonly opacity: number;
}

export interface TutorialMeta {
  readonly title: string;
  readonly author: string;
  readonly date: string;
}

export interface Tutorial {
  readonly formatVersion: typeof FORMAT_VERSION;
  readonly meta: TutorialMeta;
  readonly sheet: Sheet;
  readonly vertices: readonly Vertex[];
  readonly creases: readonly Crease[];
  readonly steps: readonly Step[];
  readonly reference?: Reference;
}
