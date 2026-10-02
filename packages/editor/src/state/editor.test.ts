import { describe, expect, it } from 'vitest';
import { SHEET_A4, createDocument } from '@faltstudio/core';
import { Editor } from './editor.js';
import { ToolController } from '../tools/tool-controller.js';
import type { CanvasPointer } from '../tools/canvas-pointer.js';

const blankEditor = (): Editor => new Editor(createDocument(SHEET_A4, 'Test', '2026-09-25'));

const folds = (editor: Editor) =>
  editor.document.get().creases.filter((crease) => crease.kind !== 'border');

const pointer = (
  phase: CanvasPointer['phase'],
  point: readonly [number, number],
  shift = false,
  alt = false,
): CanvasPointer => ({ phase, point, shift, alt, mmPerPixel: 0.5 });

describe('Editor', () => {
  it('spiegelt neue Linien bei aktiver Symmetrie an der Mittelachse', () => {
    const editor = blankEditor();
    editor.drawLine([0, 100], [50, 150]);
    expect(
      folds(editor)
        .map((crease) => crease.id)
        .sort(),
    ).toEqual(['L1', 'L1m']);
  });

  it('legt eine fast auf der Achse gezeichnete Linie exakt darauf, statt sie zu kreuzen', () => {
    const editor = blankEditor();
    editor.drawLine([104.2, 280], [105.9, 20]);
    const lines = folds(editor);
    expect(lines.map((crease) => crease.id)).toEqual(['L1']);
    const vertices = editor.document
      .get()
      .vertices.filter((vertex) =>
        lines.some((crease) => crease.a === vertex.id || crease.b === vertex.id),
      );
    expect(vertices.every((vertex) => vertex.x === 105)).toBe(true);
  });

  it('spiegelt Linien auf der Mittelachse nicht doppelt', () => {
    const editor = blankEditor();
    editor.drawLine([105, 0], [105, 297]);
    expect(folds(editor)).toHaveLength(1);
  });

  it('zeichnet ohne Symmetrie genau eine Linie in der gewaehlten Faltart', () => {
    const editor = blankEditor();
    editor.updateUi({ symmetry: false, kind: 'mountain' });
    editor.drawLine([0, 100], [50, 150]);
    expect(folds(editor).map((crease) => crease.kind)).toEqual(['mountain']);
  });

  it('ignoriert Linien unter 0,5 mm', () => {
    const editor = blankEditor();
    editor.drawLine([10, 10], [10.2, 10.2]);
    expect(editor.document.canUndo).toBe(false);
  });

  it('wendet eine neue Faltart auf die Auswahl an und macht das rueckgaengig', () => {
    const editor = blankEditor();
    editor.updateUi({ symmetry: false });
    editor.drawLine([0, 100], [210, 100]);
    editor.select(['L1']);
    editor.setKind('mountain');
    expect(folds(editor)[0]?.kind).toBe('mountain');
    editor.undo();
    expect(folds(editor)[0]?.kind).toBe('valley');
  });

  it('loescht die Auswahl und leert sie danach', () => {
    const editor = blankEditor();
    editor.updateUi({ symmetry: false });
    editor.drawLine([0, 100], [210, 100]);
    editor.select(['L1']);
    editor.deleteSelection();
    expect(folds(editor)).toEqual([]);
    expect(editor.ui.get().selection).toEqual([]);
  });

  it('liest und schreibt Dateien verlustfrei', () => {
    const editor = blankEditor();
    editor.drawLine([0, 100], [50, 150]);
    const text = editor.serialize();
    const other = blankEditor();
    other.open(text);
    expect(other.serialize()).toBe(text);
    expect(other.document.canUndo).toBe(false);
  });
});

describe('ToolController', () => {
  it('zeichnet mit zwei Klicks eine eingerastete Linie', () => {
    const editor = blankEditor();
    editor.updateUi({ symmetry: false });
    const tools = new ToolController(editor);
    tools.handle(pointer('down', [0.8, 148.5]));
    expect(editor.cursor.get().start).toEqual([0, 148.5]);
    tools.handle(pointer('down', [209.4, 148.5]));
    const [line] = folds(editor);
    expect(line).toBeDefined();
    expect(editor.cursor.get().start).toBeUndefined();
  });

  it('rastet vom Startpunkt aus auf 22,5-Grad-Strahlen ein', () => {
    const editor = blankEditor();
    editor.updateUi({
      symmetry: false,
      snaps: { vertices: false, midpoints: false, intersections: false, grid: false },
    });
    const tools = new ToolController(editor);
    tools.handle(pointer('down', [105, 297]));
    tools.handle(pointer('move', [150, 190.6]));
    expect(editor.cursor.get().snap).toBe('angle');
  });

  it('waehlt Linien per Klick und erweitert mit Shift', () => {
    const editor = blankEditor();
    editor.updateUi({ symmetry: false });
    editor.drawLine([0, 100], [210, 100]);
    editor.drawLine([0, 200], [210, 200]);
    editor.updateUi({ tool: 'select' });
    const tools = new ToolController(editor);
    tools.handle(pointer('down', [50, 101]));
    tools.handle(pointer('down', [50, 199], true));
    expect(editor.ui.get().selection).toEqual(['L1', 'L2']);
    tools.handle(pointer('down', [50, 150]));
    expect(editor.ui.get().selection).toEqual([]);
  });

  it('waehlt mit Alt alle Stuecke einer geschnittenen Linie', () => {
    const editor = blankEditor();
    editor.updateUi({ symmetry: false });
    editor.drawLine([0, 100], [210, 100]);
    editor.drawLine([105, 0], [105, 297]);
    editor.updateUi({ tool: 'select' });
    const tools = new ToolController(editor);
    tools.handle(pointer('down', [50, 101], false, true));
    expect([...editor.ui.get().selection].sort()).toEqual(['L1.1', 'L1.2']);
  });

  it('rastet mit Symmetrie auf die Mittelachse ein', () => {
    const editor = blankEditor();
    editor.updateUi({
      snaps: { vertices: false, midpoints: false, intersections: false, grid: false },
    });
    const tools = new ToolController(editor);
    tools.handle(pointer('move', [106.5, 150]));
    expect(editor.cursor.get()).toMatchObject({
      point: [105, 150],
      snap: 'edge',
      snapCrease: 'Mittelachse',
    });
  });

  it('veraendert beim Messen das Dokument nicht', () => {
    const editor = blankEditor();
    editor.updateUi({ tool: 'measure' });
    const tools = new ToolController(editor);
    tools.handle(pointer('down', [0, 0]));
    tools.handle(pointer('down', [100, 100]));
    expect(editor.document.canUndo).toBe(false);
  });
});
