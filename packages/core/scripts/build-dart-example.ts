/**
 * Erzeugt examples/dart-a4.json: klassischer Pfeil auf A4 in acht Schritten.
 *
 * Die Linien der Schritte 1 bis 6 sind hergeleitet (test/fixtures/dart.ts).
 * Die Fluegellinien entstehen aus dem gefalteten Zustand nach Schritt 6: eine
 * Gerade von der Nase nach (132, 0) wird durch alle Lagen verfolgt, jede Lage
 * bekommt ihr eigenes Segment. Aufruf: pnpm --filter @faltstudio/core example:dart
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  FORMAT_VERSION,
  applyKinds,
  kindMismatches,
  SHEET_A4,
  createTimeline,
  dot3,
  frontNormal,
  linesToGraph,
  normalize3,
  preparePattern,
  serializeTutorial,
  traceLine,
  transformOf,
  centroid,
  type FoldPattern,
  type FoldState,
  type LineInput,
  type Step,
  type Tutorial,
  type Vec2,
  type Vec3,
} from '../src/index.js';
import { dartThroughStepSix } from '../test/fixtures/dart.js';

interface StepPlan {
  readonly id: string;
  readonly title: string;
  readonly text: string;
  readonly sequential?: boolean;
  readonly folds: readonly {
    readonly lines: readonly string[];
    readonly movingPoint: Vec2;
    readonly angle: number;
  }[];
}

const NOSE: Vec3 = [105, 297, 0];
const WING_TAIL: Vec3 = [132, 0, 0];

const PLAN: readonly StepPlan[] = [
  {
    id: 's1',
    title: 'Mittelfalte vorfalten',
    text: 'Blatt längs in der Mitte falten und wieder öffnen.',
    sequential: true,
    folds: [
      { lines: ['L1'], movingPoint: [20, 20], angle: 180 },
      { lines: ['L1'], movingPoint: [20, 20], angle: -180 },
    ],
  },
  {
    id: 's2',
    title: 'Rechte Ecke zur Mitte',
    text: 'Rechte obere Ecke an die Mittelfalte legen.',
    folds: [{ lines: ['L3'], movingPoint: [205, 290], angle: 180 }],
  },
  {
    id: 's3',
    title: 'Linke Ecke zur Mitte',
    text: 'Greif die Ecke und falte sie entlang der gestrichelten Achse auf die Mittelfalte, bis sie einrastet.',
    folds: [{ lines: ['L2'], movingPoint: [5, 290], angle: 180 }],
  },
  {
    id: 's4',
    title: 'Rechte Kante zur Mitte',
    text: 'Die neue rechte Schrägkante an die Mittelfalte legen. Die Falte geht durch zwei Lagen.',
    folds: [{ lines: ['L5', "L5'"], movingPoint: [205, 150], angle: 180 }],
  },
  {
    id: 's5',
    title: 'Linke Kante zur Mitte',
    text: 'Die linke Schrägkante ebenso an die Mitte legen.',
    folds: [{ lines: ['L4', "L4'"], movingPoint: [5, 150], angle: 180 }],
  },
  {
    id: 's6',
    title: 'Entlang der Mitte falten',
    text: 'Den Flieger entlang der Mittelfalte nach hinten zusammenklappen.',
    folds: [{ lines: ['L1'], movingPoint: [20, 20], angle: -180 }],
  },
  {
    id: 's7',
    title: 'Rechter Flügel',
    text: 'Den oberen Flügel entlang der Linie von der Nase zum Heck nach vorn klappen, bis er waagerecht steht.',
    folds: [{ lines: ['W7'], movingPoint: [200, 20], angle: 90 }],
  },
  {
    id: 's8',
    title: 'Linker Flügel',
    text: 'Den unteren Flügel ebenso klappen. Fertig – guten Flug!',
    folds: [{ lines: ['W8'], movingPoint: [10, 20], angle: 90 }],
  },
];

const piecesOf = (pattern: FoldPattern, line: string): readonly string[] =>
  pattern.graph.creases
    .map((crease) => crease.id)
    .filter((id) => id === line || id.startsWith(`${line}.`));

function toSteps(pattern: FoldPattern, plan: readonly StepPlan[]): readonly Step[] {
  return plan.map(({ folds, ...step }) => ({
    ...step,
    folds: folds.map((fold) => ({
      creaseIds: fold.lines.flatMap((line) => piecesOf(pattern, line)),
      movingPoint: fold.movingPoint,
      angle: fold.angle,
    })),
  }));
}

function wingLines(pattern: FoldPattern, state: FoldState): readonly LineInput[] {
  const direction = normalize3([WING_TAIL[0] - NOSE[0], WING_TAIL[1] - NOSE[1], 0]);
  const segments = traceLine(pattern, state, NOSE, direction);
  const counters = { W7: 0, W8: 0 };
  return segments.map((segment) => {
    const face = pattern.faceById.get(segment.faceId);
    const right = centroid(face?.polygon ?? [])[0] > 105;
    const wing = right ? 'W7' : 'W8';
    const hingeFront: Vec3 = right ? [0, 0, 1] : [0, 0, -1];
    const facesFront = dot3(frontNormal(transformOf(state, segment.faceId)), hingeFront) > 0;
    counters[wing] += 1;
    return {
      id: `${wing}.w${counters[wing]}`,
      a: segment.a,
      b: segment.b,
      kind: facesFront ? 'valley' : 'mountain',
    };
  });
}

function assertClean(pattern: FoldPattern, steps: readonly Step[]): FoldState {
  const timeline = createTimeline(pattern, steps);
  if (timeline.issues.length > 0) throw new Error(JSON.stringify(timeline.issues, null, 2));
  if (pattern.dangling.length > 0) throw new Error(`Lose Enden: ${pattern.dangling.join(', ')}`);
  return timeline.boundaries.at(-1) as FoldState;
}

const bodyPattern = preparePattern(linesToGraph(dartThroughStepSix));
const afterSix = createTimeline(bodyPattern, toSteps(bodyPattern, PLAN.slice(0, 6)))
  .boundaries[6] as FoldState;
const wings = wingLines(bodyPattern, afterSix);
const rawPattern = preparePattern(linesToGraph([...dartThroughStepSix, ...wings]));
const rawSteps = toSteps(rawPattern, PLAN);
assertClean(rawPattern, rawSteps);

/** Linienarten aus dem gefalteten Endzustand, nicht aus einer Faustregel. */
const finalKinds = new Map(
  kindMismatches(createTimeline(rawPattern, rawSteps))
    .filter((entry) => entry.folded !== 'unfolded')
    .map((entry) => [entry.creaseId, entry.folded as 'mountain' | 'valley']),
);
const corrected = applyKinds(
  { ...rawPattern.graph, steps: rawSteps } as unknown as Tutorial,
  finalKinds,
);
const fullPattern = preparePattern(corrected);
const steps = toSteps(fullPattern, PLAN);
assertClean(fullPattern, steps);
const leftover = kindMismatches(createTimeline(fullPattern, steps));
if (leftover.length > 0) throw new Error(`Linienarten passen nicht: ${JSON.stringify(leftover)}`);

const tutorial: Tutorial = {
  formatVersion: FORMAT_VERSION,
  meta: { title: 'Pfeil (Dart)', author: 'Faltstudio', date: '2026-09-25' },
  sheet: SHEET_A4,
  vertices: fullPattern.graph.vertices,
  creases: fullPattern.graph.creases,
  steps,
};

const target = fileURLToPath(new URL('../../../examples/dart-a4.json', import.meta.url));
writeFileSync(target, serializeTutorial(tutorial));
console.log(
  `dart-a4.json: ${tutorial.vertices.length} Vertices, ${tutorial.creases.length} Creases, ${fullPattern.faces.length} Flaechen, ${steps.length} Schritte`,
);
