import { html, svg, type SVGTemplateResult, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { BaseElement } from '../../internal/base-element.js';
import { uiMsg } from '../../i18n/ui-messages.js';
import { boolProp, numberProp } from '../../internal/enum-prop.js';
import { emit } from '../../internal/emit.js';
import { part } from '../../internal/part.js';
import { DIAL, SNAP_ANGLES, angleFrom, pointAt, roundAngle, snapAngle } from './dial-geometry.js';
import { dialStyles } from './dial.styles.js';

const KEY_STEPS: Readonly<Record<string, number>> = {
  ArrowRight: 1,
  ArrowUp: 1,
  ArrowLeft: -1,
  ArrowDown: -1,
  PageUp: 10,
  PageDown: -10,
};

const TICK_STEP = 5;

/**
 * Drehregler (C04): Winkelmesser 0-180 Grad, rastet bei 90 und 180 (+/- 3) ein.
 * Bedienbar per Ziehen, Pfeiltasten (Shift = 10 Grad), Page Up/Down, Home/End.
 *
 * @fires input - Waehrend des Ziehens, detail: Winkel in Grad.
 * @fires change - Nach Loslassen oder Tastendruck, detail: Winkel in Grad.
 * @csspart dial - Die bedienbare SVG-Flaeche.
 */
export class Dial extends BaseElement {
  static override styles = [BaseElement.styles, dialStyles];

  @numberProp({ min: 0, max: 180, fallback: 0 })
  value = 0;

  /** Ohne Wert die Vorgabe der aktuellen Sprache. */
  @property({ reflect: true })
  label = '';

  @boolProp()
  disabled = false;

  #dragging = false;

  #toDialPoint(event: PointerEvent): { x: number; y: number } {
    const box = (event.currentTarget as Element).getBoundingClientRect();
    return {
      x: ((event.clientX - box.left) / box.width) * DIAL.width,
      y: ((event.clientY - box.top) / box.height) * DIAL.height,
    };
  }

  #set(degrees: number, eventName: 'input' | 'change'): void {
    const next = roundAngle(snapAngle(Math.min(180, Math.max(0, degrees))));
    if (next === this.value && eventName === 'input') return;
    this.value = next;
    emit(this, eventName, next);
  }

  #onPointerDown(event: PointerEvent): void {
    if (this.disabled) return;
    (event.currentTarget as Element).setPointerCapture(event.pointerId);
    this.#dragging = true;
    this.#set(angleFrom(this.#toDialPoint(event)), 'input');
  }

  #onPointerMove(event: PointerEvent): void {
    if (!this.#dragging) return;
    this.#set(angleFrom(this.#toDialPoint(event)), 'input');
  }

  #onPointerUp(): void {
    if (!this.#dragging) return;
    this.#dragging = false;
    emit(this, 'change', this.value);
  }

  #keyTarget(event: KeyboardEvent): number | undefined {
    if (event.key === 'Home') return 0;
    if (event.key === 'End') return 180;
    const step = KEY_STEPS[event.key];
    if (step === undefined) return undefined;
    return Math.round(this.value) + step * (event.shiftKey ? 10 : 1);
  }

  #onKeydown(event: KeyboardEvent): void {
    if (this.disabled) return;
    const target = this.#keyTarget(event);
    if (target === undefined) return;
    event.preventDefault();
    this.value = roundAngle(Math.min(180, Math.max(0, target)));
    emit(this, 'change', this.value);
  }

  #renderTicks(): SVGTemplateResult[] {
    const ticks: SVGTemplateResult[] = [];
    for (let degrees = 0; degrees <= 180; degrees += TICK_STEP)
      ticks.push(this.#renderTick(degrees));
    return ticks;
  }

  #renderTick(degrees: number): SVGTemplateResult {
    const major = degrees % 30 === 0;
    const outer = pointAt(degrees);
    const inner = pointAt(degrees, DIAL.radius - (major ? 12 : degrees % 10 === 0 ? 7 : 4));
    const label = pointAt(degrees, DIAL.radius + 13);
    return svg`
      <line class=${major ? 'tick major' : 'tick'} x1=${outer.x} y1=${outer.y} x2=${inner.x} y2=${inner.y}></line>
      ${major ? svg`<text class="tick-label" x=${label.x} y=${label.y + 3}>${degrees}</text>` : ''}
    `;
  }

  #renderSnapMarks(): SVGTemplateResult[] {
    return SNAP_ANGLES.map((degrees) => {
      const mark = pointAt(degrees, DIAL.radius - 20);
      return svg`<circle class="snap" cx=${mark.x} cy=${mark.y} r="2.5"></circle>`;
    });
  }

  #renderNeedle(): SVGTemplateResult {
    const end = pointAt(this.value);
    const tip = pointAt(this.value, DIAL.radius - 16);
    const start = pointAt(0);
    const arc = `M ${start.x} ${start.y} A ${DIAL.radius} ${DIAL.radius} 0 0 1 ${end.x} ${end.y}`;
    return svg`
      ${this.value > 0.5 ? svg`<path class="progress" d=${arc}></path>` : ''}
      <line class="needle" x1=${DIAL.cx} y1=${DIAL.cy} x2=${tip.x} y2=${tip.y}></line>
      <circle class="knob" cx=${end.x} cy=${end.y} r="9"></circle>
      <circle class="hub" cx=${DIAL.cx} cy=${DIAL.cy} r="4"></circle>
    `;
  }

  protected override render(): TemplateResult {
    const left = pointAt(0);
    const right = pointAt(180);
    return html`
      <svg
        class="dial"
        part=${part('dial')}
        viewBox="0 0 ${DIAL.width} ${DIAL.height}"
        role="slider"
        tabindex=${this.disabled ? -1 : 0}
        aria-label=${this.label || uiMsg().dialLabel}
        aria-valuemin="0"
        aria-valuemax="180"
        aria-valuenow=${this.value}
        aria-valuetext=${uiMsg().degrees(this.value.toFixed(1))}
        aria-disabled=${this.disabled ? 'true' : 'false'}
        @pointerdown=${this.#onPointerDown}
        @pointermove=${this.#onPointerMove}
        @pointerup=${this.#onPointerUp}
        @pointercancel=${this.#onPointerUp}
        @keydown=${this.#onKeydown}
      >
        <path
          class="arc"
          d="M ${left.x} ${left.y} A ${DIAL.radius} ${DIAL.radius} 0 0 1 ${right.x} ${right.y}"
        ></path>
        <line class="base" x1=${left.x - 10} y1=${DIAL.cy} x2=${right.x + 10} y2=${DIAL.cy}></line>
        ${this.#renderTicks()} ${this.#renderSnapMarks()} ${this.#renderNeedle()}
      </svg>
    `;
  }
}
