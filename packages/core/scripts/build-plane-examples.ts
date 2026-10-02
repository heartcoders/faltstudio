/**
 * Erzeugt examples/nakamura-a4.json und examples/hammerkopf-a4.json aus dem
 * gefalteten Zustand (siehe example-builder.ts). Koordinaten in mm, A4 hochkant,
 * y nach oben, Nase oben bei y = 297. Aufruf: pnpm --filter @faltstudio/core example:planes
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { SHEET_A4, serializeTutorial, type Vec2, type Vec3 } from '../src/index.js';
import { buildExample, type PlannedStep, type ExampleSpec } from './example-builder.js';

/** Hier knickt die Nase nach unten: knapp unter den Ecken der ersten Klappen (y = 192). */
const NOSE_LINE_Y = 190;
/** Nakamura: die zweiten Ecken treffen sich hier auf der Mitte, die Spitze bleibt darunter frei. */
const MEET_Y = 102;
const LOCK_Y = 95;

const flatAbove = (y: number) => (point: Vec2) => point[1] > y;
const nearCenter = (reach: number) => (point: Vec3) => Math.abs(point[0] - 105) < reach;
const rightHalf = (point: Vec2) => point[0] > 105;
const leftHalf = (point: Vec2) => point[0] < 105;

/** Faltlinie, die die Ecke `corner` auf `target` legt: Mittelsenkrechte der beiden. */
function cornerTo(corner: Vec2, target: Vec2): { readonly through: Vec3; readonly toward: Vec3 } {
  const mid: Vec2 = [(corner[0] + target[0]) / 2, (corner[1] + target[1]) / 2];
  const along: Vec2 = [-(target[1] - corner[1]), target[0] - corner[0]];
  return { through: [mid[0], mid[1], 0], toward: [mid[0] + along[0], mid[1] + along[1], 0] };
}

const PREFOLD: PlannedStep = {
  id: 's1',
  title: 'Mittelfalte vorfalten',
  text: 'Blatt längs in der Mitte falten und wieder öffnen.',
  sequential: true,
  folds: [
    { through: [105, 0, 0], toward: [105, 297, 0], movingPoint: [20, 20], angle: 180 },
    { reuse: 's1a', movingPoint: [20, 20], angle: -180 },
  ],
};

const CORNERS: readonly PlannedStep[] = [
  {
    id: 's2',
    title: 'Rechte Ecke zur Mitte',
    text: 'Rechte obere Ecke an die Mittelfalte legen.',
    folds: [{ through: [105, 297, 0], toward: [210, 192, 0], movingPoint: [205, 290], angle: 180 }],
  },
  {
    id: 's3',
    title: 'Linke Ecke zur Mitte',
    text: 'Linke obere Ecke ebenso an die Mitte legen.',
    folds: [{ through: [105, 297, 0], toward: [0, 192, 0], movingPoint: [5, 290], angle: 180 }],
  },
  {
    id: 's4',
    title: 'Spitze nach unten',
    text: 'Die Spitze an der Unterkante der Klappen nach unten falten.',
    folds: [
      {
        through: [0, NOSE_LINE_Y, 0],
        toward: [210, NOSE_LINE_Y, 0],
        movingPoint: [80, 250],
        angle: 180,
      },
    ],
  },
];

const halfAndWings = (
  first: number,
  wingFrom: Vec3,
  wingTo: Vec3,
  finish: string,
): readonly PlannedStep[] => [
  {
    id: `s${first}`,
    title: 'Entlang der Mitte falten',
    text: 'Den Flieger entlang der Mittelfalte nach hinten zusammenklappen.',
    folds: [{ through: [105, 0, 0], toward: [105, 297, 0], movingPoint: [20, 20], angle: -180 }],
  },
  {
    id: `s${first + 1}`,
    title: 'Rechter Flügel',
    text: 'Den oberen Flügel entlang der Linie nach vorn klappen, bis er waagerecht steht.',
    folds: [
      { through: wingFrom, toward: wingTo, layers: rightHalf, movingPoint: [200, 20], angle: 90 },
    ],
  },
  {
    id: `s${first + 2}`,
    title: 'Linker Flügel',
    text: finish,
    folds: [
      { through: wingFrom, toward: wingTo, layers: leftHalf, movingPoint: [10, 20], angle: 90 },
    ],
  },
];

const NAKAMURA: ExampleSpec = {
  title: 'Nakamura-Lock',
  date: '2026-10-02',
  sheet: SHEET_A4,
  steps: [
    PREFOLD,
    ...CORNERS,
    {
      id: 's5',
      title: 'Linke Ecke zur Mitte',
      text: 'Die neue linke Ecke so zur Mitte falten, dass die Spitze darunter frei bleibt.',
      folds: [{ ...cornerTo([0, NOSE_LINE_Y], [105, MEET_Y]), movingPoint: [3, 186], angle: 180 }],
    },
    {
      id: 's6',
      title: 'Rechte Ecke zur Mitte',
      text: 'Die rechte Ecke ebenso. Beide Ecken treffen sich über der Spitze.',
      folds: [
        { ...cornerTo([210, NOSE_LINE_Y], [105, MEET_Y]), movingPoint: [207, 186], angle: 180 },
      ],
    },
    {
      id: 's7',
      title: 'Spitze verriegeln',
      text: 'Die kleine Spitze nach oben über die Ecken falten. Sie hält alles zusammen.',
      folds: [
        {
          through: [0, LOCK_Y, 0],
          toward: [210, LOCK_Y, 0],
          layers: flatAbove(NOSE_LINE_Y),
          region: nearCenter(40),
          movingPoint: [101, 291],
          angle: 180,
        },
      ],
    },
    ...halfAndWings(
      8,
      [113, NOSE_LINE_Y, 0],
      [128, 0, 0],
      'Den unteren Flügel ebenso klappen. Fertig – ein ruhiger Gleiter.',
    ),
  ],
};

/** Hammerkopf: die Spitze wird wieder hochgeklappt und ragt aus dem stumpfen Kopf heraus. */
const HEAD_LINE_Y = 150;

const HAMMERKOPF: ExampleSpec = {
  title: 'Hammerkopf',
  date: '2026-10-02',
  sheet: SHEET_A4,
  steps: [
    PREFOLD,
    ...CORNERS,
    {
      id: 's5',
      title: 'Spitze wieder hoch',
      text: 'Die Spitze nach oben falten, sodass sie über den stumpfen Kopf hinausragt.',
      folds: [
        {
          through: [0, HEAD_LINE_Y, 0],
          toward: [210, HEAD_LINE_Y, 0],
          layers: flatAbove(NOSE_LINE_Y),
          region: nearCenter(80),
          movingPoint: [90, 260],
          angle: 180,
        },
      ],
    },
    ...halfAndWings(
      6,
      [117, 297, 0],
      [119, 0, 0],
      'Den unteren Flügel ebenso klappen. Fertig – breite Flügel, schwerer Kopf.',
    ),
  ],
};

for (const [file, spec] of [
  ['nakamura-a4.json', NAKAMURA],
  ['hammerkopf-a4.json', HAMMERKOPF],
] as const) {
  const tutorial = buildExample(spec);
  const target = fileURLToPath(new URL(`../../../examples/${file}`, import.meta.url));
  writeFileSync(target, serializeTutorial(tutorial));
  console.log(
    `${file}: ${tutorial.vertices.length} Vertices, ${tutorial.creases.length} Creases, ${tutorial.steps.length} Schritte`,
  );
}
