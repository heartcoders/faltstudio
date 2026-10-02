import type { CreaseKind } from '../model/index.js';

export type SampleFoldKind = Extract<CreaseKind, 'valley' | 'mountain'>;

/**
 * Musterdaten des Pfeil-Fliegers aus dem Faltstudio-Design, in Modellkoordinaten
 * (mm, Ursprung links unten). Nur fuer die UI-Geruestbau-Phase: Editor und Viewer zeigen damit das
 * Design, bis Core-Geometrie (M1), Faltengine (M2) und Store (M3) echte
 * Tutorials liefern. Danach ersetzt examples/dart-a4.json diese Datei.
 */

export interface SampleLine {
  readonly id: string;
  readonly a: readonly [number, number];
  readonly b: readonly [number, number];
  readonly kind: CreaseKind;
}

export interface SampleStep {
  readonly index: string;
  readonly title: string;
  readonly text: string;
  readonly kind: SampleFoldKind;
  readonly angle: number;
  readonly creases: readonly string[];
  readonly face?: readonly (readonly [number, number])[];
  readonly warning?: string;
}

const H = 297;
const flip = (x: number, y: number): readonly [number, number] => [x, H - y];

export const SAMPLE_LINES: readonly SampleLine[] = [
  { id: 'L1', a: flip(105, 0), b: flip(105, 297), kind: 'valley' },
  { id: 'L2a', a: flip(105, 0), b: flip(52.5, 52.5), kind: 'valley' },
  { id: 'L2b', a: flip(52.5, 52.5), b: flip(0, 105), kind: 'valley' },
  { id: 'L3', a: flip(105, 0), b: flip(210, 105), kind: 'valley' },
  { id: 'L4', a: flip(105, 0), b: flip(0, 253.5), kind: 'valley' },
  { id: 'L5', a: flip(105, 0), b: flip(210, 253.5), kind: 'valley' },
  { id: 'L6', a: flip(105, 0), b: flip(78, 297), kind: 'mountain' },
  { id: 'L7', a: flip(105, 0), b: flip(132, 297), kind: 'mountain' },
  { id: 'H1', a: flip(0, 105), b: flip(210, 105), kind: 'flat' },
  { id: 'H2', a: flip(0, 148.5), b: flip(210, 148.5), kind: 'flat' },
];

export const SAMPLE_SNAPS: readonly (readonly [number, number])[] = [
  flip(105, 0),
  flip(0, 105),
  flip(210, 105),
  flip(52.5, 52.5),
  flip(105, 105),
  flip(105, 148.5),
  flip(0, 253.5),
  flip(210, 253.5),
];

export const SAMPLE_STEPS: readonly SampleStep[] = [
  {
    index: '01',
    title: 'Mittelfalte vorfalten',
    text: 'Blatt längs in der Mitte falten und wieder öffnen.',
    kind: 'valley',
    angle: 180,
    creases: ['L1'],
  },
  {
    index: '02',
    title: 'Rechte Ecke zur Mitte',
    text: 'Rechte obere Ecke an die Mittelfalte legen.',
    kind: 'valley',
    angle: 180,
    creases: ['L3'],
    face: [flip(105, 0), flip(210, 0), flip(210, 105)],
  },
  {
    index: '03',
    title: 'Linke Ecke zur Mitte',
    text: 'Greif die Ecke und falte sie entlang der gestrichelten Achse auf die Mittelfalte, bis sie einrastet.',
    kind: 'valley',
    angle: 180,
    creases: ['L2a', 'L2b'],
    face: [flip(0, 0), flip(105, 0), flip(0, 105)],
  },
  {
    index: '04',
    title: 'Rechte Kante zur Mitte',
    text: 'Die neue rechte Schrägkante an die Mittelfalte legen.',
    kind: 'valley',
    angle: 180,
    creases: ['L5'],
  },
  {
    index: '05',
    title: 'Linke Kante zur Mitte',
    text: 'Die linke Schrägkante ebenso an die Mitte legen.',
    kind: 'valley',
    angle: 180,
    creases: ['L4'],
  },
  {
    index: '06',
    title: 'Entlang der Mitte falten',
    text: '',
    kind: 'mountain',
    angle: 180,
    creases: ['L1'],
    warning: 'W1',
  },
  {
    index: '07',
    title: 'Rechter Flügel',
    text: 'Rechten Flügel nach unten klappen, bis er waagerecht steht.',
    kind: 'mountain',
    angle: 90,
    creases: ['L7'],
  },
  {
    index: '08',
    title: 'Linker Flügel',
    text: 'Linken Flügel ebenso klappen. Fertig.',
    kind: 'mountain',
    angle: 90,
    creases: ['L6'],
  },
];
