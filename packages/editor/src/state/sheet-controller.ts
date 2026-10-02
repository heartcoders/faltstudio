import type { ReactiveController, ReactiveControllerHost } from 'lit';
import type { FoldPattern, FoldState, RestPose } from '@faltstudio/core';
import type * as CoreThree from '@faltstudio/core/three';
import type { FoldedSheet } from '@faltstudio/core/three';
import { readTokenColor, type Scene } from '@faltstudio/ui';

type ThreeModule = typeof CoreThree;

let threeModule: Promise<ThreeModule> | undefined;

/** three.js kommt erst, wenn die erste 3D-Ansicht es braucht; danach aus dem Cache. */
function loadThree(): Promise<ThreeModule> {
  threeModule ??= Promise.all([
    import('@faltstudio/core/three'),
    customElements.whenDefined('fl-scene'),
  ]).then(([module]) => module);
  return threeModule;
}

export interface SheetSource {
  scene(): Scene | null | undefined;
  pattern(): FoldPattern;
  /** Anzuzeigender Faltzustand; undefined = flaches Blatt. */
  state(): FoldState | undefined;
  /** Optionale Praesentationsdrehung (Ruhelage des fertigen Modells) mit Anteil 0..1. */
  pose?(): { readonly pose: RestPose | undefined; readonly amount: number };
}

/**
 * Haelt das 3D-Blatt einer Editor-Ansicht aktuell: baut es neu, wenn sich das
 * Muster aendert, schreibt nach jedem Rendern den Zustand und raeumt beim
 * Entfernen auf. Laedt three.js und <fl-scene> erst beim ersten Bedarf nach.
 */
export class SheetController implements ReactiveController {
  readonly #host: ReactiveControllerHost & Element;
  readonly #source: SheetSource;
  #three: ThreeModule | undefined;
  #sheet: FoldedSheet | undefined;
  #pattern: FoldPattern | undefined;
  #fitted = false;

  constructor(host: ReactiveControllerHost & Element, source: SheetSource) {
    this.#host = host;
    this.#source = source;
    host.addController(this);
  }

  hostUpdated(): void {
    if (this.#three) return this.#sync(this.#three);
    void loadThree().then((module) => {
      this.#three = module;
      this.#sync(module);
    });
  }

  hostDisconnected(): void {
    this.#sheet?.dispose();
    this.#sheet = undefined;
    this.#pattern = undefined;
    this.#fitted = false;
  }

  #sync(three: ThreeModule): void {
    const scene = this.#source.scene();
    if (!scene?.isConnected) return;
    const pattern = this.#source.pattern();
    if (pattern !== this.#pattern) this.#rebuild(three, scene, pattern);
    const state = this.#source.state() ?? three.flatStateFor(pattern);
    this.#sheet?.update(state);
    const pose = this.#source.pose?.();
    if (this.#sheet) three.applyRestPose(this.#sheet.group, pose?.pose, pose?.amount ?? 0);
    if (this.#sheet) scene.setFloor?.(this.#sheet.lowestZ);
    if (this.#fitted || !this.#sheet) return;
    this.#fitted = true;
    scene.fitContent();
  }

  #rebuild(three: ThreeModule, scene: Scene, pattern: FoldPattern): void {
    this.#sheet?.dispose();
    this.#pattern = pattern;
    this.#sheet = new three.FoldedSheet(pattern, {
      paper: readTokenColor(this.#host, 'paper'),
      paperBack: readTokenColor(this.#host, 'paper-back'),
      edge: readTokenColor(this.#host, 'paper-edge'),
      crease: readTokenColor(this.#host, 'ink'),
    });
    this.#sheet.update(this.#source.state() ?? three.flatStateFor(pattern));
    scene.setContent(this.#sheet.group, { fit: false });
  }
}
