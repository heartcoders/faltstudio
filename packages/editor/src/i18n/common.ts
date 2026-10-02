import { messages } from '@faltstudio/ui';

/**
 * Begriffe, die mehrere Bereiche des Studios teilen. Bereichseigene Texte
 * stehen in den Nachbardateien (start.ts, editor.ts, steps.ts).
 */
interface CommonMessages {
  readonly kinds: {
    readonly valley: string;
    readonly mountain: string;
    readonly flat: string;
    readonly unfolded: string;
  };
  readonly close: string;
  readonly cancel: string;
  readonly back: string;
  readonly next: string;
  readonly show: string;
  readonly adopt: string;
  readonly untitled: string;
  readonly step: (number: string) => string;
  readonly stepOf: (number: string, total: string) => string;
  readonly steps: (count: number) => string;
}

const de: CommonMessages = {
  kinds: { valley: 'Tal', mountain: 'Berg', flat: 'Flach', unfolded: 'nicht gefaltet' },
  close: 'Schließen',
  cancel: 'Abbrechen',
  back: 'Zurück',
  next: 'Weiter',
  show: 'Zeigen',
  adopt: 'Übernehmen',
  untitled: 'Ohne Titel',
  step: (number) => `Schritt ${number}`,
  stepOf: (number, total) => `Schritt ${number} von ${total}`,
  steps: (count) => `${count} ${count === 1 ? 'Schritt' : 'Schritte'}`,
};

const en: CommonMessages = {
  kinds: { valley: 'Valley', mountain: 'Mountain', flat: 'Flat', unfolded: 'not folded' },
  close: 'Close',
  cancel: 'Cancel',
  back: 'Back',
  next: 'Next',
  show: 'Show',
  adopt: 'Apply',
  untitled: 'Untitled',
  step: (number) => `Step ${number}`,
  stepOf: (number, total) => `Step ${number} of ${total}`,
  steps: (count) => `${count} ${count === 1 ? 'step' : 'steps'}`,
};

/** Gemeinsame Begriffe in der aktuellen Sprache; beim Rendern aufrufen. */
export const common = messages({ de, en });
