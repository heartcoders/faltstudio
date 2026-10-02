/** Mitgelieferte Beispiele aus examples/*.json, zur Build-Zeit eingebunden. */
const files = import.meta.glob('../../../../examples/*.json', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

export interface ExampleModel {
  readonly id: string;
  readonly title: string;
  readonly text: string;
}

function titleOf(text: string, fallback: string): string {
  try {
    return (JSON.parse(text) as { meta?: { title?: string } }).meta?.title ?? fallback;
  } catch {
    return fallback;
  }
}

export const EXAMPLES: readonly ExampleModel[] = Object.entries(files).map(([path, text]) => {
  const id =
    path
      .split('/')
      .at(-1)
      ?.replace(/\.json$/, '') ?? path;
  return { id, title: titleOf(text, id), text };
});

export const findExample = (id: string): ExampleModel | undefined =>
  EXAMPLES.find((example) => example.id === id);
