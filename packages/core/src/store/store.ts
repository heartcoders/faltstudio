export type Listener<T> = (state: T, previous: T) => void;

export interface Store<T> {
  get(): T;
  /** Setzt einen neuen Snapshot. Mit `record: false` entsteht kein Undo-Schritt. */
  set(next: T | ((current: T) => T), options?: { readonly record?: boolean }): void;
  subscribe(listener: Listener<T>): () => void;
  undo(): boolean;
  redo(): boolean;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  /** Anzahl aufgezeichneter Aenderungen seit dem Anlegen, fuer "Rev. 17". */
  readonly revision: number;
  /** Ersetzt den Zustand und leert den Verlauf, z.B. beim Oeffnen einer Datei. */
  reset(state: T): void;
}

export interface StoreOptions {
  /** 0 schaltet den Verlauf ab (reiner UI-Zustand). */
  readonly historyLimit?: number;
}

/**
 * Beobachtbarer Zustand fuer die UI mit unveraenderlichen Snapshots. Undo und
 * Redo tauschen nur Referenzen; der Zustand selbst wird nie veraendert.
 */
export function createStore<T>(initial: T, { historyLimit = 100 }: StoreOptions = {}): Store<T> {
  let current = initial;
  let past: T[] = [];
  let future: T[] = [];
  let revision = 0;
  const listeners = new Set<Listener<T>>();

  const emit = (previous: T): void => {
    for (const listener of listeners) listener(current, previous);
  };

  const replace = (next: T): void => {
    const previous = current;
    current = next;
    emit(previous);
  };

  return {
    get: () => current,
    set(next, { record = true } = {}) {
      const value = typeof next === 'function' ? (next as (state: T) => T)(current) : next;
      if (Object.is(value, current)) return;
      if (record && historyLimit > 0) {
        past = [...past, current].slice(-historyLimit);
        future = [];
        revision += 1;
      }
      replace(value);
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    undo() {
      const previous = past.at(-1);
      if (previous === undefined) return false;
      past = past.slice(0, -1);
      future = [current, ...future];
      revision -= 1;
      replace(previous);
      return true;
    },
    redo() {
      const [next, ...rest] = future;
      if (next === undefined) return false;
      future = rest;
      past = [...past, current];
      revision += 1;
      replace(next);
      return true;
    },
    get canUndo() {
      return past.length > 0;
    },
    get canRedo() {
      return future.length > 0;
    },
    get revision() {
      return revision;
    },
    reset(state) {
      past = [];
      future = [];
      revision = 0;
      replace(state);
    },
  };
}

/** Merkt sich das letzte Ergebnis je Eingabe-Referenz; fuer abgeleitete Daten wie das Faltmuster. */
export function memoizeLast<A, R>(compute: (input: A) => R): (input: A) => R {
  let lastInput: A | undefined;
  let lastResult: R | undefined;
  let hasResult = false;
  return (input) => {
    if (hasResult && Object.is(input, lastInput)) return lastResult as R;
    lastInput = input;
    lastResult = compute(input);
    hasResult = true;
    return lastResult;
  };
}
