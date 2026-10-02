import { html, type PropertyValues, type TemplateResult } from 'lit';
import type { Intersection, Object3D } from 'three';
import { property, query } from 'lit/decorators.js';
import { createSheetMesh } from '@faltstudio/core/three';
import { BaseElement } from '../../internal/base-element.js';
import { uiMsg } from '../../i18n/ui-messages.js';
import { numberProp } from '../../internal/enum-prop.js';
import { readTokenColor } from '../../internal/css-color.js';
import {
  SceneRenderer,
  type CameraPose,
  type CameraView,
  type PointerRay,
  type SceneColors,
} from './scene-renderer.js';
import { sceneStyles } from './scene.styles.js';

/**
 * three.js-Ansicht mit OrbitControls. Braucht als einzige Komponente eine eigene
 * Box und ueberschreibt darum `display: contents` am Host.
 *
 * Bis M2 zeigt sie das ungefaltete Blatt in den Massen aus `sheet-width` und
 * `sheet-height` (mm).
 */
export class Scene extends BaseElement {
  static override styles = [BaseElement.styles, sceneStyles];

  @numberProp({ min: 1, fallback: 210 }, { attribute: 'sheet-width' })
  sheetWidth = 210;

  @numberProp({ min: 1, fallback: 297 }, { attribute: 'sheet-height' })
  sheetHeight = 297;

  /** Vorgelesener Name der 3D-Ansicht; ohne Wert die Vorgabe der aktuellen Sprache. */
  @property() label = '';

  @query('canvas') private canvas?: HTMLCanvasElement | null;

  #renderer: SceneRenderer | undefined;
  #resizeObserver: ResizeObserver | undefined;
  #content: Object3D | undefined;
  #fitTarget: Object3D | undefined;
  #fitPending = false;

  /**
   * Ersetzt das Platzhalter-Blatt durch eigenen Inhalt, z.B. ein FoldedSheet.
   * Methode statt Property: ein three.js-Objekt ist kein serialisierbarer Wert.
   */
  setContent(
    content: Object3D,
    options: { readonly fit?: boolean; readonly fitTo?: Object3D } = {},
  ): void {
    this.#content = content;
    this.#fitTarget = options.fitTo;
    this.#fitPending = options.fit ?? true;
    this.#showContent();
  }

  /** Orbit-Steuerung an oder aus, z.B. waehrend der Nutzer eine Faltung zieht. */
  setControlsEnabled(enabled: boolean): void {
    if (this.#renderer) this.#renderer.controlsEnabled = enabled;
  }

  pointerRay(clientX: number, clientY: number): PointerRay | undefined {
    return this.#renderer?.pointerRay(clientX, clientY);
  }

  pick(clientX: number, clientY: number, targets: readonly Object3D[]): Intersection | undefined {
    return this.#renderer?.pick(clientX, clientY, targets);
  }

  project(
    point: readonly [number, number, number],
  ): { readonly x: number; readonly y: number } | undefined {
    return this.#renderer?.project(point);
  }

  setPose(pose: CameraPose): void {
    this.#renderer?.setPose(pose);
  }

  setView(view: CameraView): void {
    this.#renderer?.setView(view);
  }

  /** Boden unter den tiefsten Punkt des Inhalts legen (mm, weich nachgefuehrt). */
  setFloor(z: number): void {
    this.#renderer?.setFloor(z);
  }

  /** Drehpunkt weich auf die Mitte des Inhalts setzen, z.B. nach einer Faltung. */
  recenter(): void {
    const target = this.#fitTarget ?? this.#content;
    if (target) this.#renderer?.recenter(target);
  }

  /** Kamera erneut auf den aktuellen Inhalt einpassen, z.B. nach einem Schritt. */
  fitContent(): void {
    const target = this.#fitTarget ?? this.#content;
    if (target) this.#renderer?.fit(target);
  }

  #showContent(): void {
    if (!this.#renderer || !this.#content) return;
    this.#renderer.setContent(this.#content);
    if (this.#fitPending) this.#renderer.fit(this.#fitTarget ?? this.#content);
    this.#fitPending = false;
  }

  protected override firstUpdated(): void {
    if (!this.canvas) return;
    this.#renderer = new SceneRenderer(this.canvas, this.#readColors());
    this.#resizeObserver = new ResizeObserver(([entry]) => {
      if (entry) this.#renderer?.resize(entry.contentRect.width, entry.contentRect.height);
    });
    this.#resizeObserver.observe(this.canvas);
    this.#showContent();
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (this.#content) return;
    if (!changed.has('sheetWidth') && !changed.has('sheetHeight')) return;
    const sheet = { width: this.sheetWidth, height: this.sheetHeight };
    this.#renderer?.setContent(createSheetMesh(sheet));
    this.#renderer?.setTarget(sheet.width / 2, sheet.height / 2, 0);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#resizeObserver?.disconnect();
    this.#renderer?.dispose();
    this.#renderer = undefined;
  }

  #readColors(): SceneColors {
    return {
      background: readTokenColor(this, 'table'),
    };
  }

  protected override render(): TemplateResult {
    return html`<canvas aria-label=${this.label || uiMsg().sceneLabel} role="img"></canvas>`;
  }
}
