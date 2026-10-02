import { dragAngle, dragProgress, type FoldHandle } from '@faltstudio/core';
import type { FoldedSheet } from '@faltstudio/core/three';
import type { Scene } from '@faltstudio/ui';
import { SNAP_RATIO } from './viewer-state.js';

/**
 * Greifring als Trefferflaeche in CSS-Pixeln. Nur hier startet eine Faltung;
 * Ziehen irgendwo sonst dreht die Kamera, auch auf dem Papier.
 */
const GRIP_HIT_PX = 44;

export interface FoldDragHost {
  scene(): Scene | null | undefined;
  sheet(): FoldedSheet | undefined;
  handle(): FoldHandle | undefined;
  /** Nur im Zustand "Bereit" darf gegriffen werden. */
  canGrab(): boolean;
  onDragStart(): void;
  onDrag(progress: number): void;
  onRelease(snap: boolean): void;
}

/**
 * Zieh-Geste der Faltung: Zeigerstrahl -> Winkel um die Achse -> Fortschritt.
 * Laeuft auf dem <fl-scene>-Host in der Capture-Phase, damit die Orbit-Steuerung
 * gar nicht erst startet, wenn die bewegliche Seite gegriffen wird.
 */
export class FoldDrag {
  readonly #host: FoldDragHost;
  readonly #pointers = new Set<number>();
  #active: number | undefined;
  #angle = 0;
  #progress = 0;

  constructor(host: FoldDragHost) {
    this.#host = host;
  }

  attach(element: HTMLElement): () => void {
    const down = (event: PointerEvent): void => this.#down(event, element);
    const move = (event: PointerEvent): void => this.#move(event);
    const up = (event: PointerEvent): void => this.#up(event);
    element.addEventListener('pointerdown', down, { capture: true });
    element.addEventListener('pointermove', move);
    element.addEventListener('pointerup', up);
    element.addEventListener('pointercancel', up);
    return () => {
      element.removeEventListener('pointerdown', down, { capture: true });
      element.removeEventListener('pointermove', move);
      element.removeEventListener('pointerup', up);
      element.removeEventListener('pointercancel', up);
    };
  }

  #grabs(event: PointerEvent): boolean {
    const [scene, handle] = [this.#host.scene(), this.#host.handle()];
    if (!scene || !this.#host.sheet() || !handle) return false;
    const box = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const grip = scene.project(handle.grip);
    return (
      grip !== undefined &&
      Math.hypot(event.clientX - box.left - grip.x, event.clientY - box.top - grip.y) <= GRIP_HIT_PX
    );
  }

  #down(event: PointerEvent, element: HTMLElement): void {
    this.#pointers.add(event.pointerId);
    if (this.#pointers.size > 1) return this.#cancel();
    if (!this.#host.canGrab() || !this.#grabs(event)) return;
    this.#host.scene()?.setControlsEnabled(false);
    element.setPointerCapture(event.pointerId);
    this.#active = event.pointerId;
    this.#angle = 0;
    this.#progress = 0;
    this.#host.onDragStart();
  }

  #move(event: PointerEvent): void {
    const [scene, handle] = [this.#host.scene(), this.#host.handle()];
    if (event.pointerId !== this.#active || !scene || !handle) return;
    const ray = scene.pointerRay(event.clientX, event.clientY);
    if (!ray) return;
    this.#angle = dragAngle(handle, ray, this.#angle);
    this.#progress = dragProgress(handle, this.#angle);
    this.#host.onDrag(this.#progress);
  }

  #up(event: PointerEvent): void {
    this.#pointers.delete(event.pointerId);
    if (event.pointerId !== this.#active) return;
    this.#finish(this.#progress >= SNAP_RATIO);
  }

  #cancel(): void {
    if (this.#active !== undefined) this.#finish(false);
  }

  #finish(snap: boolean): void {
    this.#active = undefined;
    this.#host.scene()?.setControlsEnabled(true);
    this.#host.onRelease(snap);
  }
}
