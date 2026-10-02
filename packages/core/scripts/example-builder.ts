/**
 * Baut ein Beispielmodell Schritt fuer Schritt aus dem gefalteten Zustand.
 *
 * Jede Faltung ist eine Gerade in Weltkoordinaten des aktuellen Zustands
 * (Punkt + Richtung, wie man sie auf dem gefalteten Flieger einzeichnen
 * wuerde). Die Gerade wird durch alle Lagen verfolgt (`traceLine`), jede Lage
 * bekommt ihr eigenes Segment. Mit `layers` laesst sich auf einen Teil der
 * Lagen beschraenken, etwa nur den oberen Fluegel. So entstehen Muster, die
 * wirklich flach faltbar sind, ohne Spiegelsegmente von Hand zu rechnen.
 * Linienarten (Berg/Tal) kommen am Ende aus dem gefalteten Endzustand.
 */
import {
  FORMAT_VERSION,
  applyKinds,
  applyTransform,
  centroid,
  createTimeline,
  kindMismatches,
  lift,
  liftOf,
  linesToGraph,
  normalize3,
  preparePattern,
  sheetBorder,
  traceLine,
  transformOf,
  type FoldPattern,
  type FoldState,
  type LineInput,
  type Sheet,
  type Step,
  type Tutorial,
  type Vec2,
  type Vec3,
} from '../src/index.js';

export interface TracedFold {
  /** Punkt auf der Faltlinie im aktuellen Zustand (mm, Weltkoordinaten). */
  readonly through: Vec3;
  /** Zweiter Punkt auf der Faltlinie; zusammen mit `through` die Richtung. */
  readonly toward: Vec3;
  /** Nur Lagen, deren Flaeche (flach, Schwerpunkt) diese Bedingung erfuellt. */
  readonly layers?: (flatCentroid: Vec2) => boolean;
  /**
   * Nur Stuecke, deren Mitte im aktuellen Zustand hier liegt. Die Gerade ist
   * unendlich; ohne Bereich traefe sie auch weggeklappte Lagen anderswo.
   */
  readonly region?: (worldMid: Vec3) => boolean;
  readonly movingPoint: Vec2;
  readonly angle: number;
}

export interface ReusedFold {
  /** Nochmal entlang der Linien eines frueheren Schritts, z.B. Wiederoeffnen. */
  readonly reuse: string;
  readonly movingPoint: Vec2;
  readonly angle: number;
}

export type PlannedFold = TracedFold | ReusedFold;

export interface PlannedStep {
  readonly id: string;
  readonly title: string;
  readonly text: string;
  readonly sequential?: boolean;
  readonly folds: readonly PlannedFold[];
}

export interface ExampleSpec {
  readonly title: string;
  readonly date: string;
  readonly sheet: Sheet;
  readonly steps: readonly PlannedStep[];
}

const isReused = (fold: PlannedFold): fold is ReusedFold => 'reuse' in fold;

const lineIdOf = (stepIndex: number, foldIndex: number): string =>
  `S${stepIndex + 1}${String.fromCharCode(97 + foldIndex)}`;

const ON_LINE_MM = 1e-4;

function onSegment(point: Vec2, a: Vec2, b: Vec2): boolean {
  const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const t = ((point[0] - a[0]) * (b[0] - a[0]) + (point[1] - a[1]) * (b[1] - a[1])) / length ** 2;
  const across = Math.abs((point[0] - a[0]) * (b[1] - a[1]) - (point[1] - a[1]) * (b[0] - a[0]));
  return t > -ON_LINE_MM && t < 1 + ON_LINE_MM && across / length < ON_LINE_MM;
}

/**
 * Alle Crease-Stuecke, die auf den gezeichneten Segmenten einer Faltung liegen.
 * Nach Lage statt nach Name: faellt eine Faltung auf eine schon vorhandene
 * Linie (Zusammenklappen entlang der Vorfalte), uebernimmt das Muster deren
 * Namen, und die Stuecke gehoeren trotzdem dazu.
 */
function piecesOf(pattern: FoldPattern, built: Built, line: string): readonly string[] {
  const segments = built.lines.filter((entry) => entry.id.startsWith(`${line}.`));
  return pattern.graph.creases
    .filter((crease) => crease.kind !== 'border')
    .filter((crease) => {
      const a = pattern.positions.get(crease.a);
      const b = pattern.positions.get(crease.b);
      if (!a || !b) return false;
      return segments.some(
        (segment) => onSegment(a, segment.a, segment.b) && onSegment(b, segment.a, segment.b),
      );
    })
    .map((crease) => crease.id);
}

interface Built {
  readonly lines: readonly LineInput[];
  readonly lineOfFold: ReadonlyMap<string, string>;
}

function toSteps(pattern: FoldPattern, spec: ExampleSpec, built: Built, count: number): Step[] {
  return spec.steps.slice(0, count).map((step, stepIndex) => ({
    id: step.id,
    title: step.title,
    text: step.text,
    ...(step.sequential ? { sequential: true } : {}),
    folds: step.folds.map((fold, foldIndex) => {
      const line = isReused(fold)
        ? (built.lineOfFold.get(fold.reuse) ?? fold.reuse)
        : lineIdOf(stepIndex, foldIndex);
      const creaseIds = piecesOf(pattern, built, line);
      if (creaseIds.length === 0) throw new Error(`${step.id}: keine Linie fuer ${line}`);
      return { creaseIds, movingPoint: fold.movingPoint, angle: fold.angle };
    }),
  }));
}

function stateBefore(
  spec: ExampleSpec,
  built: Built,
  stepIndex: number,
): {
  readonly pattern: FoldPattern;
  readonly state: FoldState;
} {
  const pattern = preparePattern(linesToGraph(built.lines));
  const timeline = createTimeline(pattern, toSteps(pattern, spec, built, stepIndex));
  if (timeline.issues.length > 0)
    throw new Error(`Vor Schritt ${stepIndex + 1}: ${JSON.stringify(timeline.issues, null, 2)}`);
  return { pattern, state: timeline.boundaries[stepIndex] as FoldState };
}

function traceFold(
  pattern: FoldPattern,
  state: FoldState,
  fold: TracedFold,
  id: string,
): readonly LineInput[] {
  const direction = normalize3([
    fold.toward[0] - fold.through[0],
    fold.toward[1] - fold.through[1],
    fold.toward[2] - fold.through[2],
  ]);
  const keepLayer = fold.layers ?? (() => true);
  const keepRegion = fold.region ?? (() => true);
  const worldMid = (faceId: string, a: Vec2, b: Vec2): Vec3 => {
    const flat = lift((a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
    return applyTransform(transformOf(state, faceId), [flat[0], flat[1], liftOf(state, faceId)]);
  };
  const segments = traceLine(pattern, state, fold.through, direction).filter(
    (segment) =>
      keepLayer(centroid(pattern.faceById.get(segment.faceId)?.polygon ?? [])) &&
      keepRegion(worldMid(segment.faceId, segment.a, segment.b)),
  );
  if (segments.length === 0) throw new Error(`${id}: Gerade trifft keine Lage`);
  return segments.map((segment, index) => ({
    id: `${id}.t${index + 1}`,
    a: segment.a,
    b: segment.b,
    kind: 'valley' as const,
  }));
}

function addStep(spec: ExampleSpec, built: Built, stepIndex: number): Built {
  const step = spec.steps[stepIndex] as PlannedStep;
  const { pattern, state } = stateBefore(spec, built, stepIndex);
  const lineOfFold = new Map(built.lineOfFold);
  const added = step.folds.flatMap((fold, foldIndex) => {
    const id = lineIdOf(stepIndex, foldIndex);
    if (isReused(fold)) return [];
    lineOfFold.set(`${step.id}${String.fromCharCode(97 + foldIndex)}`, id);
    return traceFold(pattern, state, fold, id);
  });
  return { lines: [...built.lines, ...added], lineOfFold };
}

function assertClean(pattern: FoldPattern, steps: readonly Step[]): void {
  const timeline = createTimeline(pattern, steps);
  if (timeline.issues.length > 0) throw new Error(JSON.stringify(timeline.issues, null, 2));
  if (pattern.dangling.length > 0) throw new Error(`Lose Enden: ${pattern.dangling.join(', ')}`);
}

/**
 * Baut das Tutorial aus dem Plan und prueft es: jeder Schritt faltet ohne
 * Befund, keine losen Enden, Linienarten passen zum Endzustand.
 *
 * @param spec - Titel, Blatt und Schritte.
 * @returns Fertiges Tutorial; wirft mit Begruendung, wenn etwas nicht faltbar ist.
 */
export function buildExample(spec: ExampleSpec): Tutorial {
  let built: Built = { lines: sheetBorder(spec.sheet), lineOfFold: new Map() };
  for (let index = 0; index < spec.steps.length; index += 1) built = addStep(spec, built, index);
  const rawPattern = preparePattern(linesToGraph(built.lines));
  const rawSteps = toSteps(rawPattern, spec, built, spec.steps.length);
  assertClean(rawPattern, rawSteps);
  const finalKinds = new Map(
    kindMismatches(createTimeline(rawPattern, rawSteps))
      .filter((entry) => entry.folded !== 'unfolded')
      .map((entry) => [entry.creaseId, entry.folded as 'mountain' | 'valley']),
  );
  const corrected = applyKinds(
    { ...rawPattern.graph, steps: rawSteps } as unknown as Tutorial,
    finalKinds,
  );
  const pattern = preparePattern(corrected);
  const steps = toSteps(pattern, spec, built, spec.steps.length);
  assertClean(pattern, steps);
  const leftover = kindMismatches(createTimeline(pattern, steps));
  if (leftover.length > 0) throw new Error(`Linienarten passen nicht: ${JSON.stringify(leftover)}`);
  return {
    formatVersion: FORMAT_VERSION,
    meta: { title: spec.title, author: 'Faltstudio', date: spec.date },
    sheet: spec.sheet,
    vertices: pattern.graph.vertices,
    creases: pattern.graph.creases,
    steps,
  };
}
