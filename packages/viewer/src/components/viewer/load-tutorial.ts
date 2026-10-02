import {
  createTimeline,
  parseTutorial,
  preparePattern,
  type Timeline,
  type Tutorial,
} from '@faltstudio/core';

export interface LoadedTutorial {
  readonly tutorial: Tutorial;
  readonly timeline: Timeline;
}

/** Die Datei war nicht erreichbar; `status` ist der HTTP-Status fuer die Meldung. */
export class TutorialLoadError extends Error {
  override readonly name = 'TutorialLoadError';

  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function fetchText(src: string, signal: AbortSignal): Promise<string> {
  const response = await fetch(src, { signal });
  if (!response.ok)
    throw new TutorialLoadError(`${src} answered ${response.status}`, response.status);
  return response.text();
}

/** Laedt, prueft und faltet ein Tutorial vor. Wirft `TutorialLoadError` oder `TutorialFormatError`. */
export async function loadTutorial(src: string, signal: AbortSignal): Promise<LoadedTutorial> {
  const tutorial = parseTutorial(await fetchText(src, signal));
  const timeline = createTimeline(preparePattern(tutorial), tutorial.steps);
  return { tutorial, timeline };
}
