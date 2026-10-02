export const EDITOR_MODES = ['photo', 'lines', 'steps', 'preview'] as const;
export type EditorMode = (typeof EDITOR_MODES)[number];
