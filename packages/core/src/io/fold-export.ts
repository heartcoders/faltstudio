import type { CreaseKind, Tutorial } from '../model/index.js';
import { detectFaces, planarize } from '../geometry/index.js';

/** Ausschnitt der FOLD-Spezifikation 1.1, den der Export schreibt. */
export interface FoldFile {
  readonly file_spec: 1.1;
  readonly file_creator: string;
  readonly file_title: string;
  readonly file_classes: readonly ['singleModel'];
  readonly frame_classes: readonly ['creasePattern'];
  readonly frame_attributes: readonly ['2D'];
  readonly frame_unit: 'mm';
  readonly vertices_coords: readonly (readonly [number, number])[];
  readonly edges_vertices: readonly (readonly [number, number])[];
  readonly edges_assignment: readonly ('B' | 'M' | 'V' | 'F')[];
  readonly edges_foldAngle: readonly number[];
  readonly faces_vertices: readonly (readonly number[])[];
}

const ASSIGNMENT: Readonly<Record<CreaseKind, 'B' | 'M' | 'V' | 'F'>> = {
  border: 'B',
  mountain: 'M',
  valley: 'V',
  flat: 'F',
};

/** FOLD-Konvention: Tal +180, Berg -180, Rand und Hilfslinie 0. */
const FOLD_ANGLE: Readonly<Record<CreaseKind, number>> = {
  border: 0,
  mountain: -180,
  valley: 180,
  flat: 0,
};

/**
 * Exportiert das Faltmuster als FOLD-Datei, z.B. zum Gegenpruefen im Origami
 * Simulator. Die Linienart ist der Endzustand; Schritte gehen nicht mit.
 */
export function toFold(tutorial: Tutorial): FoldFile {
  const graph = planarize(tutorial);
  const index = new Map(graph.vertices.map((vertex, position) => [vertex.id, position]));
  const at = (id: string): number => index.get(id) as number;
  return {
    file_spec: 1.1,
    file_creator: 'Faltstudio',
    file_title: tutorial.meta.title,
    file_classes: ['singleModel'],
    frame_classes: ['creasePattern'],
    frame_attributes: ['2D'],
    frame_unit: 'mm',
    vertices_coords: graph.vertices.map((vertex) => [vertex.x, vertex.y]),
    edges_vertices: graph.creases.map((crease) => [at(crease.a), at(crease.b)]),
    edges_assignment: graph.creases.map((crease) => ASSIGNMENT[crease.kind]),
    edges_foldAngle: graph.creases.map((crease) => FOLD_ANGLE[crease.kind]),
    faces_vertices: detectFaces(graph).faces.map((face) => face.vertexIds.map(at)),
  };
}

export function serializeFold(tutorial: Tutorial): string {
  return `${JSON.stringify(toFold(tutorial), null, 2)}\n`;
}
