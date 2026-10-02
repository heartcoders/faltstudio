import { snapPoint, type SnapResult, type SnapTargets, type Vec2 } from '@faltstudio/core';
import type { Editor } from '../state/editor.js';
import { hitCrease, wholeLine } from './hit-test.js';
import { ANGLE_STEP_DEG, GRID_MM, type SnapSettings } from '../state/editor-state.js';
import { hitRadius, type CanvasPointer } from './canvas-pointer.js';

function snapTargets(settings: SnapSettings, withAngle: boolean): SnapTargets {
  return {
    vertices: settings.vertices,
    midpoints: settings.midpoints,
    edges: settings.intersections,
    grid: settings.grid ? GRID_MM : 0,
    angleStep: withAngle ? ANGLE_STEP_DEG : 0,
  };
}

/**
 * Setzt Zeigerereignisse der Zeichenflaeche in Aktionen um: Linie (zwei Klicks,
 * eingerastet), Auswahl (Klick, Shift erweitert), Messen (zwei Punkte, ohne
 * Aenderung am Dokument). Haelt nur den Startpunkt der laufenden Geste.
 */
export class ToolController {
  readonly #editor: Editor;
  #start: Vec2 | undefined;

  constructor(editor: Editor) {
    this.#editor = editor;
  }

  cancel(): void {
    this.#start = undefined;
    this.#editor.cursor.set((cursor) => {
      const next = { ...cursor };
      delete next.start;
      return next;
    });
  }

  handle(pointer: CanvasPointer): void {
    if (pointer.phase === 'leave')
      return this.#editor.cursor.set({ ...(this.#start ? { start: this.#start } : {}) });
    const { tool } = this.#editor.ui.get();
    if (tool === 'select') return this.#select(pointer);
    const snapped = this.#snap(pointer);
    this.#editor.cursor.set({
      point: snapped.point,
      snap: snapped.kind,
      ...(snapped.creaseId ? { snapCrease: snapped.creaseId } : {}),
      ...(this.#start ? { start: this.#start } : {}),
    });
    if (pointer.phase === 'down') this.#click(snapped.point, tool === 'line');
  }

  #snap(pointer: CanvasPointer): SnapResult {
    const tolerance = hitRadius(pointer);
    const result = snapPoint(this.#editor.pattern.graph, pointer.point, {
      targets: snapTargets(this.#editor.ui.get().snaps, this.#start !== undefined),
      tolerance,
      ...(this.#start ? { start: this.#start } : {}),
    });
    return this.#onAxis(result, tolerance);
  }

  /** Mit Symmetrie ist die Mittelachse eine Einrastkante, auch ohne gezeichnete Linie. */
  #onAxis(result: SnapResult, tolerance: number): SnapResult {
    if (!this.#editor.ui.get().symmetry) return result;
    if (result.kind === 'vertex' || result.kind === 'midpoint' || result.kind === 'intersection')
      return result;
    const axis = this.#editor.document.get().sheet.width / 2;
    if (Math.abs(result.point[0] - axis) > tolerance) return result;
    return { ...result, point: [axis, result.point[1]], kind: 'edge', creaseId: 'Mittelachse' };
  }

  #click(point: Vec2, commits: boolean): void {
    if (!this.#start) {
      this.#start = point;
      this.#editor.cursor.set((cursor) => ({ ...cursor, start: point }));
      return;
    }
    if (commits) this.#editor.drawLine(this.#start, point);
    this.cancel();
  }

  #select(pointer: CanvasPointer): void {
    this.#editor.cursor.set({ point: pointer.point });
    if (pointer.phase !== 'down') return;
    const hit = hitCrease(this.#editor.pattern, pointer.point, hitRadius(pointer));
    const { selection } = this.#editor.ui.get();
    if (!hit) return this.#editor.select(pointer.shift ? selection : []);
    const picked = pointer.alt ? wholeLine(this.#editor.pattern, hit) : [hit];
    const allSelected = picked.every((id) => selection.includes(id));
    const toggled = allSelected
      ? selection.filter((id) => !picked.includes(id))
      : [...new Set([...selection, ...picked])];
    this.#editor.select(pointer.shift ? toggled : picked);
  }
}
