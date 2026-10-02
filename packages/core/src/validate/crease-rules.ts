import { angleOf, sub, type Vec2 } from '../math/index.js';
import type { Crease, CreaseId, Sheet, VertexId } from '../model/index.js';
import type { CreaseGraph } from '../geometry/index.js';

export const PATTERN_ISSUE_CODES = ['maekawa', 'kawasaki', 'dangling', 'outside', 'short'] as const;
export type PatternIssueCode = (typeof PATTERN_ISSUE_CODES)[number];

export interface PatternIssue {
  readonly code: PatternIssueCode;
  readonly severity: 'error' | 'warning';
  readonly title: string;
  readonly message: string;
  readonly vertexId?: VertexId;
  readonly creaseIds?: readonly CreaseId[];
  /**
   * Messwert fuer die Uebersetzung in der UI: bei Maekawa |B − T|, bei
   * Kawasaki die Summe der ungeraden Winkel in Grad.
   */
  readonly value?: number;
  /** Stelle im flachen Blatt, auf die "Zeigen" springt. */
  readonly at?: Vec2;
}

const KAWASAKI_TOLERANCE_DEG = 0.5;
const SHORT_LINE_MM = 0.5;
const BORDER_TOLERANCE_MM = 0.01;

interface VertexContext {
  readonly id: VertexId;
  readonly position: Vec2;
  readonly folds: readonly Crease[];
  readonly onBorder: boolean;
}

function vertexContexts(graph: CreaseGraph): readonly VertexContext[] {
  const positions = new Map(
    graph.vertices.map((vertex) => [vertex.id, [vertex.x, vertex.y] as Vec2]),
  );
  return graph.vertices.map((vertex) => {
    const incident = graph.creases.filter(
      (crease) => crease.a === vertex.id || crease.b === vertex.id,
    );
    return {
      id: vertex.id,
      position: positions.get(vertex.id) as Vec2,
      folds: incident.filter((crease) => crease.kind === 'mountain' || crease.kind === 'valley'),
      onBorder: incident.some((crease) => crease.kind === 'border'),
    };
  });
}

function sectorAngles(graph: CreaseGraph, context: VertexContext): readonly number[] {
  const positions = new Map(
    graph.vertices.map((vertex) => [vertex.id, [vertex.x, vertex.y] as Vec2]),
  );
  const directions = context.folds
    .map((crease) => positions.get(crease.a === context.id ? crease.b : crease.a) as Vec2)
    .map((end) => angleOf(sub(end, context.position)))
    .sort((left, right) => left - right);
  return directions.map((angle, index) => {
    const next =
      index + 1 < directions.length
        ? (directions[index + 1] as number)
        : (directions[0] as number) + 2 * Math.PI;
    return ((next - angle) * 180) / Math.PI;
  });
}

function checkMaekawa(context: VertexContext): PatternIssue | undefined {
  const mountains = context.folds.filter((crease) => crease.kind === 'mountain').length;
  const valleys = context.folds.length - mountains;
  if (Math.abs(mountains - valleys) === 2) return undefined;
  return {
    code: 'maekawa',
    severity: 'error',
    title: `Maekawa · ${context.id}`,
    message: `|B − T| = ${Math.abs(mountains - valleys)} — erwartet 2`,
    value: Math.abs(mountains - valleys),
    vertexId: context.id,
    creaseIds: context.folds.map((crease) => crease.id),
    at: context.position,
  };
}

function checkKawasaki(graph: CreaseGraph, context: VertexContext): PatternIssue | undefined {
  const sectors = sectorAngles(graph, context);
  const odd = sectors.filter((_, index) => index % 2 === 0).reduce((sum, angle) => sum + angle, 0);
  if (Math.abs(odd - 180) <= KAWASAKI_TOLERANCE_DEG) return undefined;
  return {
    code: 'kawasaki',
    severity: 'error',
    title: `Kawasaki · ${context.id}`,
    message: `Σ ungerade Winkel ${odd.toFixed(1)}° — erwartet 180.0°`,
    value: odd,
    vertexId: context.id,
    creaseIds: context.folds.map((crease) => crease.id),
    at: context.position,
  };
}

/**
 * Flach-Faltbarkeit an inneren Vertices: Maekawa (|B − T| = 2) und Kawasaki
 * (Summe jedes zweiten Winkels = 180 Grad). Hilfslinien (flach) zaehlen nicht,
 * Randvertices und lose Enden (weniger als zwei Faltlinien, dafuer gibt es
 * die Warnung "offen") sind ausgenommen. Gilt fuer das Muster, wenn alle Berg- und
 * Talfalten zugleich flach gefaltet werden.
 */
export function checkFlatFoldability(graph: CreaseGraph): readonly PatternIssue[] {
  return vertexContexts(graph)
    .filter((context) => !context.onBorder && context.folds.length >= 2)
    .flatMap((context) =>
      [checkMaekawa(context), checkKawasaki(graph, context)].filter(
        (issue): issue is PatternIssue => issue !== undefined,
      ),
    );
}

function outside(sheet: Sheet, [x, y]: Vec2): boolean {
  const slack = BORDER_TOLERANCE_MM;
  return x < -slack || y < -slack || x > sheet.width + slack || y > sheet.height + slack;
}

/** Linien ausserhalb des Blatts, zu kurze Stuecke und lose Enden. */
export function checkLines(
  graph: CreaseGraph,
  sheet: Sheet,
  dangling: readonly CreaseId[],
): readonly PatternIssue[] {
  const positions = new Map(
    graph.vertices.map((vertex) => [vertex.id, [vertex.x, vertex.y] as Vec2]),
  );
  return graph.creases.flatMap((crease): PatternIssue[] => {
    const a = positions.get(crease.a) as Vec2;
    const b = positions.get(crease.b) as Vec2;
    const at: Vec2 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const found: PatternIssue[] = [];
    if (outside(sheet, a) || outside(sheet, b))
      found.push({
        code: 'outside',
        severity: 'error',
        title: `${crease.id} ausserhalb`,
        message: 'Liegt nicht vollständig auf dem Blatt',
        creaseIds: [crease.id],
        at,
      });
    if (Math.hypot(b[0] - a[0], b[1] - a[1]) < SHORT_LINE_MM)
      found.push({
        code: 'short',
        severity: 'warning',
        title: `${crease.id} sehr kurz`,
        message: 'Kürzer als 0,5 mm, vermutlich ein Versehen',
        creaseIds: [crease.id],
        at,
      });
    if (dangling.includes(crease.id))
      found.push({
        code: 'dangling',
        severity: 'warning',
        title: `${crease.id} offen`,
        message: 'Endet frei und begrenzt keine Fläche',
        creaseIds: [crease.id],
        at,
      });
    return found;
  });
}
