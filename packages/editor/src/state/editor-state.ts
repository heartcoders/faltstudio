import type { CreaseId, CreaseKind, SnapKind, Vec2 } from '@faltstudio/core';

export const TOOLS = ['select', 'line', 'measure'] as const;
export type Tool = (typeof TOOLS)[number];

export type DrawKind = Exclude<CreaseKind, 'border'>;

export interface SnapSettings {
  readonly vertices: boolean;
  readonly midpoints: boolean;
  readonly intersections: boolean;
  readonly grid: boolean;
}

/** Bedienzustand ohne Undo-Verlauf: Werkzeug, Faltart, Einrasten, Auswahl. */
export interface UiState {
  readonly tool: Tool;
  readonly kind: DrawKind;
  readonly symmetry: boolean;
  readonly snaps: SnapSettings;
  readonly selection: readonly CreaseId[];
  /** Ausgewaehlter Schritt im Modus Schritte und Vorschau. */
  readonly stepIndex: number;
  /** Ausgewaehlte Faltung innerhalb des Schritts. */
  readonly foldIndex: number;
  /** Winkel am Drehregler waehrend des Ziehens; geht erst beim Loslassen ins Dokument. */
  readonly angleDraft?: number | undefined;
  /** Fortschritt (0..1) der Schritt-Vorschau in 3D; 1 = Zielzustand. */
  readonly stepProgress: number;
  /** Griff P1 bis P4, der im Foto-Modus aktiv ist (0 bis 3). */
  readonly activeCorner: number;
  /** Griff waehrend des Ziehens; geht erst beim Loslassen ins Dokument. */
  readonly cornerDraft?:
    { readonly index: number; readonly point: readonly [number, number] } | undefined;
  readonly opacityDraft?: number | undefined;
  readonly savedAt?: string;
  readonly message?: string;
}

/** Zeigerzustand der Zeichenflaeche; aendert sich bei jeder Mausbewegung. */
export interface CursorState {
  readonly point?: Vec2;
  readonly snap?: SnapKind;
  readonly snapCrease?: string;
  readonly start?: Vec2;
}

export const INITIAL_UI: UiState = {
  tool: 'line',
  kind: 'valley',
  symmetry: true,
  snaps: { vertices: true, midpoints: true, intersections: true, grid: false },
  selection: [],
  stepIndex: 0,
  foldIndex: 0,
  stepProgress: 1,
  activeCorner: 1,
};

export const GRID_MM = 5;
export const ANGLE_STEP_DEG = 22.5;
