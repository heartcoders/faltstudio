import type { ReactiveController, ReactiveControllerHost } from 'lit';

/** Alles mit `subscribe`, z.B. ein Store aus @faltstudio/core. */
export interface Subscribable {
  subscribe(listener: () => void): () => void;
}

/** Rendert den Host neu, sobald sich einer der Stores aendert. */
export class StoreController implements ReactiveController {
  readonly #host: ReactiveControllerHost;
  readonly #stores: readonly Subscribable[];
  #unsubscribe: (() => void)[] = [];

  constructor(host: ReactiveControllerHost, ...stores: readonly Subscribable[]) {
    this.#host = host;
    this.#stores = stores;
    host.addController(this);
  }

  hostConnected(): void {
    this.#unsubscribe = this.#stores.map((store) =>
      store.subscribe(() => this.#host.requestUpdate()),
    );
  }

  hostDisconnected(): void {
    for (const stop of this.#unsubscribe) stop();
    this.#unsubscribe = [];
  }
}
