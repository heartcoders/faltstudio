import type { ExampleModel } from '../../state/examples.js';
import type { StoredModel } from '../../state/library.js';
import type { ModelRoute } from '../../state/route.js';

/** Ein Blatt im Faecher: eigenes Modell, mitgeliefertes Beispiel oder das neue, leere. */
export type FanItem =
  | {
      readonly kind: 'model';
      readonly key: string;
      readonly text: string;
      readonly model: StoredModel;
    }
  | {
      readonly kind: 'example';
      readonly key: string;
      readonly text: string;
      readonly example: ExampleModel;
      /** Position unter den Beispielen, fuer „Beispiel 02 / 03“. */
      readonly position: number;
    }
  | { readonly kind: 'new'; readonly key: 'new' };

/**
 * Reihenfolge im Faecher: eigene Modelle, dann die Beispiele, zuletzt das
 * neue Blatt.
 *
 * @param models - Gespeicherte Modelle, zuletzt geaenderte zuerst.
 * @param examples - Mitgelieferte Beispiele.
 * @returns Alle Blaetter in Faecher-Reihenfolge.
 */
export function fanItems(
  models: readonly StoredModel[],
  examples: readonly ExampleModel[],
): readonly FanItem[] {
  return [
    ...models.map(
      (model) => ({ kind: 'model', key: `model:${model.id}`, text: model.text, model }) as const,
    ),
    ...examples.map(
      (example, position) =>
        ({
          kind: 'example',
          key: `example:${example.id}`,
          text: example.text,
          example,
          position,
        }) as const,
    ),
    { kind: 'new', key: 'new' },
  ];
}

/**
 * Wohin Bearbeiten und Ansehen fuehren; Beispiele oeffnen als Kopie.
 *
 * @param item - Ein Blatt mit Inhalt.
 * @returns Route fuer Editor und Viewer.
 */
export const routeOf = (item: Exclude<FanItem, { kind: 'new' }>): ModelRoute =>
  item.kind === 'model'
    ? { kind: 'model', id: item.model.id }
    : { kind: 'example', id: item.example.id };
