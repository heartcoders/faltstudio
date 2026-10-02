import type { CreaseId } from '../model/index.js';

export const FOLD_ERROR_CODES = [
  'unknown-crease',
  'no-crease',
  'point-outside',
  'point-on-crease',
  'not-collinear',
  'no-moving-side',
  'everything-moves',
] as const;

export type FoldErrorCode = (typeof FOLD_ERROR_CODES)[number];

/** Warum sich eine Faltung nicht ausfuehren laesst. Der Editor zeigt das in der Validierung. */
export interface FoldError {
  readonly code: FoldErrorCode;
  readonly message: string;
  readonly creaseIds?: readonly CreaseId[];
}

export type FoldResult<T> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: FoldError };

export const success = <T>(value: T): FoldResult<T> => ({ ok: true, value });

export const failure = <T>(
  code: FoldErrorCode,
  message: string,
  creaseIds?: readonly CreaseId[],
): FoldResult<T> => ({
  ok: false,
  error: creaseIds ? { code, message, creaseIds } : { code, message },
});
