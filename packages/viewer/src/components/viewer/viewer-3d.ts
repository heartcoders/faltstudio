import { Group } from 'three';
import type { FoldPattern } from '@faltstudio/core';
import {
  FoldGuides,
  FoldedSheet,
  type GuideColors,
  type SheetColors,
} from '@faltstudio/core/three';

export interface ViewerModel {
  readonly sheet: FoldedSheet;
  readonly guides: FoldGuides;
  readonly content: Group;
}

/**
 * Alles, was three.js braucht, in einem eigenen Modul: der Viewer laedt es erst
 * nach, wenn ein Tutorial da ist. So steht die Seite, bevor ~500 kB three.js ankommen.
 */
export function createViewerModel(
  pattern: FoldPattern,
  colors: SheetColors & GuideColors,
): ViewerModel {
  const sheet = new FoldedSheet(pattern, colors);
  const guides = new FoldGuides(pattern, colors);
  const content = new Group();
  content.add(sheet.group, guides.group);
  return { sheet, guides, content };
}

export { applyRestPose as applyPose } from '@faltstudio/core/three';
