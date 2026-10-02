import { html, type TemplateResult } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import type { Turntable } from '@faltstudio/core/three';
import { BaseElement, boolProp, readTokenColor } from '@faltstudio/ui';
import { turntableModel } from './turntable-model.js';
import { editorText } from '../../i18n/editor.js';
import { modelTurntableStyles } from './model-turntable.styles.js';

let shared: Promise<Turntable> | undefined;

/** Grad Drehung je Pixel Zug: eine halbe Bildschirmbreite ist etwa eine Umdrehung. */
const TURN_PER_PX = 0.5;
const TILT_PER_PX = 0.3;

/** Ein Renderer fuer alle Karten; three.js kommt erst mit der ersten sichtbaren Karte. */
function loadTurntable(host: Element): Promise<Turntable> {
  shared ??= import('@faltstudio/core/three').then(
    ({ Turntable }) =>
      new Turntable({
        paper: readTokenColor(host, 'paper'),
        paperBack: readTokenColor(host, 'paper-back'),
        edge: readTokenColor(host, 'paper-edge'),
        crease: readTokenColor(host, 'ink'),
      }),
  );
  return shared;
}

/**
 * Drehendes 3D-Modell einer Karte in der Uebersicht. Bis das erste Bild steht,
 * zeigt der Slot das 2D-Muster; danach blendet das Modell darueber ein.
 * Gerechnet und gezeichnet wird nur, solange die Karte im Bild ist.
 *
 * @slot - Platzhalter, meist das 2D-Faltmuster.
 */
export class ModelTurntable extends BaseElement {
  static override styles = [BaseElement.styles, modelTurntableStyles];

  /** Tutorial-Datei als Text. */
  @property({ attribute: false }) text = '';
  @property() label = '';
  /** Ziehen dreht das Modell; nach dem Loslassen kehrt es in die laufende Drehung zurueck. */
  @boolProp() interactive = false;
  @state() private ready = false;
  @query('canvas') private canvas?: HTMLCanvasElement | null;

  #observer: IntersectionObserver | undefined;
  #turntable: Turntable | undefined;
  #shownText = '';
  #lastPointer: { readonly x: number; readonly y: number } | undefined;

  override connectedCallback(): void {
    super.connectedCallback();
    this.#observer = new IntersectionObserver(
      ([entry]) => void this.#handleVisibility(entry?.isIntersecting === true),
      { rootMargin: '200px 0px' },
    );
    this.#observer.observe(this);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#observer?.disconnect();
    this.#observer = undefined;
    if (this.canvas) this.#turntable?.remove(this.canvas);
    this.#shownText = '';
    this.ready = false;
  }

  async #handleVisibility(visible: boolean): Promise<void> {
    const canvas = this.canvas;
    if (!canvas) return;
    if (!visible) return this.#turntable?.setVisible(canvas, false);
    try {
      const turntable = await loadTurntable(this);
      if (!this.isConnected) return;
      this.#turntable = turntable;
      this.#ensureModel(turntable, canvas);
      turntable.setVisible(canvas, true);
    } catch (error) {
      console.error('3D-Vorschau nicht verfuegbar', error);
    }
  }

  #ensureModel(turntable: Turntable, canvas: HTMLCanvasElement): void {
    if (this.#shownText === this.text) return;
    const model = turntableModel(this.text);
    if (!model) return;
    turntable.add(canvas, model);
    this.#shownText = this.text;
    this.ready = true;
  }

  #handlePointerDown(event: PointerEvent): void {
    if (!this.interactive || !this.#turntable) return;
    (event.currentTarget as HTMLCanvasElement).setPointerCapture(event.pointerId);
    this.#lastPointer = { x: event.clientX, y: event.clientY };
  }

  #handlePointerMove(event: PointerEvent): void {
    const last = this.#lastPointer;
    const canvas = this.canvas;
    if (!last || !canvas) return;
    this.#lastPointer = { x: event.clientX, y: event.clientY };
    this.#turntable?.drag(
      canvas,
      (event.clientX - last.x) * TURN_PER_PX,
      (event.clientY - last.y) * TILT_PER_PX,
    );
  }

  #handlePointerUp(): void {
    if (!this.#lastPointer || !this.canvas) return;
    this.#lastPointer = undefined;
    this.#turntable?.release(this.canvas);
  }

  protected override render(): TemplateResult {
    return html`
      <div class=${this.ready ? 'frame ready' : 'frame'}>
        <slot></slot>
        <canvas
          class=${this.interactive ? 'grab' : ''}
          role="img"
          aria-label=${this.label || editorText().model3d}
          @pointerdown=${this.#handlePointerDown}
          @pointermove=${this.#handlePointerMove}
          @pointerup=${this.#handlePointerUp}
          @pointercancel=${this.#handlePointerUp}
        ></canvas>
      </div>
    `;
  }
}
