import type { ReactiveController, ReactiveControllerHost } from 'lit';

/** Mobil laut Design D: unter 48rem (768 px). */
export const MOBILE_QUERY = '(max-width: 47.99rem)';

/** Meldet, ob das mobile Layout gilt, und rendert den Host bei Wechsel neu. */
export class ViewportController implements ReactiveController {
  readonly #host: ReactiveControllerHost;
  readonly #query: MediaQueryList | undefined;
  readonly #onChange = (): void => this.#host.requestUpdate();

  constructor(host: ReactiveControllerHost, query: string = MOBILE_QUERY) {
    this.#host = host;
    this.#query = typeof matchMedia === 'function' ? matchMedia(query) : undefined;
    host.addController(this);
  }

  get mobile(): boolean {
    return this.#query?.matches ?? false;
  }

  hostConnected(): void {
    this.#query?.addEventListener('change', this.#onChange);
  }

  hostDisconnected(): void {
    this.#query?.removeEventListener('change', this.#onChange);
  }
}
