import type { SnapKind, Vec2 } from '@faltstudio/core';
import type { CursorState } from '../../state/editor-state.js';
import { editorText } from '../../i18n/editor.js';

const snapLabel = (snap: SnapKind): string => editorText().readout.snaps[snap];

const mm = (value: number): string => value.toFixed(1).padStart(5, '0');

export function positionText([x, y]: Vec2): string {
  return `X ${mm(x)} · Y ${mm(y)} mm`;
}

export function measureText(
  start: Vec2,
  point: Vec2,
): { readonly angle: string; readonly length: string } {
  const angle = (Math.atan2(point[1] - start[1], point[0] - start[0]) * 180) / Math.PI;
  return {
    angle: `∠ ${angle.toFixed(1)}°`,
    length: `L ${Math.hypot(point[0] - start[0], point[1] - start[1]).toFixed(1)} mm`,
  };
}

export function snapText(cursor: CursorState): string {
  if (!cursor.snap) return '';
  return `Snap · ${snapLabel(cursor.snap)}${cursor.snapCrease ? ` ${cursor.snapCrease}` : ''}`;
}

/** Zeilen fuer den Koordinaten-Tooltip (C07) und die Statuszeile. */
export function readoutLines(cursor: CursorState): readonly string[] {
  if (!cursor.point) return [];
  const lines = [positionText(cursor.point)];
  if (cursor.start) {
    const { angle, length } = measureText(cursor.start, cursor.point);
    lines.push(`${angle} · ${length}`);
  }
  const snap = snapText(cursor);
  return snap ? [...lines, snap] : lines;
}
