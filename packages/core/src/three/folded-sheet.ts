import {
  BackSide,
  Box3,
  BufferAttribute,
  BufferGeometry,
  FrontSide,
  Group,
  LineBasicMaterial,
  LineDashedMaterial,
  LineSegments,
  Mesh,
  MeshStandardMaterial,
} from 'three';
import { add3, applyTransform, frontNormal, scale3, type Vec2, type Vec3 } from '../math/index.js';
import type { Crease, FaceId } from '../model/index.js';
import type { FoldPattern } from '../fold/pattern.js';
import { liftOf, transformOf, type FoldState } from '../fold/state.js';

export interface SheetColors {
  readonly paper: string;
  readonly paperBack: string;
  readonly edge: string;
  readonly crease: string;
  /** Farbe der Falte, die als Naechstes dran ist; ohne Wert wie `crease`. */
  readonly highlight?: string;
}

/** Faltlinien schweben minimal ueber der Flaeche, damit sie nicht flackern. */
const LINE_OFFSET_MM = 0.02;
/**
 * Ist eine Falte hervorgehoben, treten alle anderen so weit zurueck. Die
 * aktuelle sticht durch Kontrast heraus statt durch eine eigene Farbe.
 */
const DIMMED_CREASE_OPACITY = 0.15;

function worldPosition(state: FoldState, faceId: FaceId, point: Vec2, extra = 0): Vec3 {
  const transform = transformOf(state, faceId);
  const lifted = add3([point[0], point[1], 0], [0, 0, liftOf(state, faceId)]);
  const base = applyTransform(transform, lifted);
  return extra === 0 ? base : add3(base, scale3(frontNormal(transform), extra));
}

function createPaperMaterial(
  color: string,
  side: typeof FrontSide | typeof BackSide,
): MeshStandardMaterial {
  return new MeshStandardMaterial({
    color,
    side,
    roughness: 0.92,
    metalness: 0,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  });
}

/**
 * Das Blatt als three.js-Objekt. Die Geometrie wird einmal angelegt; `update`
 * schreibt nur Positionen neu und ist damit billig genug fuer jede Animationsframe.
 * Vorderseite und Rueckseite haben eigene Materialien (Papier / Papier-Rueckseite).
 */
export class FoldedSheet {
  readonly group = new Group();
  readonly #pattern: FoldPattern;
  readonly #surface = new BufferGeometry();
  readonly #edges = new BufferGeometry();
  readonly #folds = new BufferGeometry();
  readonly #borderCreases: readonly Crease[];
  readonly #foldCreases: readonly Crease[];
  readonly #foldLines: LineSegments;
  /** Flaeche je Dreieck der Oberflaeche, fuer das Anklicken im Viewer. */
  readonly #triangleFaces: readonly FaceId[];
  readonly #front: Mesh;
  readonly #back: Mesh;
  readonly #focus = new BufferGeometry();
  readonly #focusLines: LineSegments;
  #highlighted: readonly Crease[] = [];
  #state: FoldState | undefined;

  constructor(pattern: FoldPattern, colors: SheetColors) {
    this.#pattern = pattern;
    this.#borderCreases = pattern.graph.creases.filter((crease) => crease.kind === 'border');
    this.#foldCreases = pattern.graph.creases.filter((crease) => crease.kind !== 'border');
    this.#triangleFaces = pattern.faces.flatMap((face) => face.triangles.map(() => face.id));
    const triangleCount = this.#triangleFaces.length;
    this.#surface.setAttribute(
      'position',
      new BufferAttribute(new Float32Array(triangleCount * 9), 3),
    );
    this.#edges.setAttribute(
      'position',
      new BufferAttribute(new Float32Array(this.#borderCreases.length * 6), 3),
    );
    this.#folds.setAttribute(
      'position',
      new BufferAttribute(new Float32Array(this.#foldCreases.length * 6), 3),
    );
    this.#foldLines = new LineSegments(
      this.#folds,
      new LineDashedMaterial({
        color: colors.crease,
        dashSize: 3,
        gapSize: 2,
        transparent: true,
      }),
    );
    this.#front = new Mesh(this.#surface, createPaperMaterial(colors.paper, FrontSide));
    this.#back = new Mesh(this.#surface, createPaperMaterial(colors.paperBack, BackSide));
    for (const side of [this.#front, this.#back]) side.castShadow = true;
    this.#focus.setAttribute('position', new BufferAttribute(new Float32Array(0), 3));
    this.#focusLines = new LineSegments(
      this.#focus,
      new LineDashedMaterial({ color: colors.highlight ?? colors.crease, dashSize: 3, gapSize: 2 }),
    );
    this.group.add(
      this.#front,
      this.#back,
      new LineSegments(this.#edges, new LineBasicMaterial({ color: colors.edge })),
      this.#foldLines,
      this.#focusLines,
    );
  }

  /** Tiefster Punkt des Papiers in Weltkoordinaten (mm), inklusive Praesentationsdrehung. */
  get lowestZ(): number {
    return new Box3().setFromObject(this.group).min.z;
  }

  /** Beide Seiten des Papiers als Ziel fuer einen Raycaster. */
  get pickTargets(): readonly Mesh[] {
    return [this.#front, this.#back];
  }

  /** Flaeche zum Dreieck `faceIndex` eines Raycast-Treffers. */
  faceIdAt(triangleIndex: number): FaceId | undefined {
    return this.#triangleFaces[triangleIndex];
  }

  /**
   * Hebt Falten hervor, meist die des naechsten Schritts: sie bleiben kraeftig,
   * alle anderen werden blass. Eine leere Liste zeigt wieder alle gleich.
   *
   * @param creaseIds - Crease-IDs aus dem Muster; unbekannte werden ignoriert.
   */
  highlight(creaseIds: readonly string[]): void {
    const next = creaseIds.flatMap((id) => this.#pattern.creaseById.get(id) ?? []);
    const same =
      next.length === this.#highlighted.length &&
      next.every((crease, index) => crease === this.#highlighted[index]);
    if (same) return;
    this.#highlighted = next;
    this.#focus.setAttribute('position', new BufferAttribute(new Float32Array(next.length * 6), 3));
    (this.#foldLines.material as LineDashedMaterial).opacity =
      next.length > 0 ? DIMMED_CREASE_OPACITY : 1;
    if (this.#state) this.#writeFocus(this.#state);
  }

  update(state: FoldState): void {
    this.#state = state;
    this.#writeFocus(state);
    this.#writeSurface(state);
    this.#writeLines(this.#edges, this.#borderCreases, state);
    this.#writeLines(this.#folds, this.#foldCreases, state);
    this.#foldLines.computeLineDistances();
    this.#surface.computeVertexNormals();
    this.#surface.computeBoundingSphere();
    this.#surface.computeBoundingBox();
  }

  dispose(): void {
    this.#surface.dispose();
    this.#edges.dispose();
    this.#folds.dispose();
    this.#focus.dispose();
    this.group.traverse((object) => {
      if (object instanceof Mesh || object instanceof LineSegments)
        (object.material as { dispose(): void }).dispose();
    });
  }

  #writeSurface(state: FoldState): void {
    const target = this.#surface.getAttribute('position') as BufferAttribute;
    let offset = 0;
    for (const face of this.#pattern.faces) {
      for (const corner of face.triangles.flat()) {
        target.setXYZ(offset++, ...worldPosition(state, face.id, face.polygon[corner] as Vec2));
      }
    }
    target.needsUpdate = true;
  }

  #writeFocus(state: FoldState): void {
    this.#writeLines(this.#focus, this.#highlighted, state);
    this.#focusLines.computeLineDistances();
  }

  #writeLines(geometry: BufferGeometry, creases: readonly Crease[], state: FoldState): void {
    const target = geometry.getAttribute('position') as BufferAttribute;
    creases.forEach((crease, index) => {
      const [faceId] = this.#pattern.adjacency.facesByCrease.get(crease.id) ?? [];
      const a = this.#pattern.positions.get(crease.a);
      const b = this.#pattern.positions.get(crease.b);
      if (!faceId || !a || !b) return;
      target.setXYZ(index * 2, ...worldPosition(state, faceId, a, LINE_OFFSET_MM));
      target.setXYZ(index * 2 + 1, ...worldPosition(state, faceId, b, LINE_OFFSET_MM));
    });
    target.needsUpdate = true;
    geometry.computeBoundingSphere();
  }
}
