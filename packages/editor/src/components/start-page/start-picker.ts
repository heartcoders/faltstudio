import { html, svg, type TemplateResult } from 'lit';
import { state } from 'lit/decorators.js';
import { BaseElement, emit } from '@faltstudio/ui';
import { startText } from '../../i18n/start.js';
import { EXAMPLES } from '../../state/examples.js';
import { editorHref, type SheetFormat } from '../../state/route.js';
import { cardData } from './model-card-data.js';
import { startPickerStyles } from './start-picker.styles.js';

type StartOption = 'blank' | 'photo' | 'example';

const OPTIONS: readonly StartOption[] = ['blank', 'photo', 'example'];

const FORMATS: readonly { readonly value: SheetFormat; readonly label: string }[] = [
  { value: 'a4', label: 'A4' },
  { value: 'letter', label: 'Letter' },
];

/**
 * Neues Modell (Design R3): Startart als drei Papierkarten, die gewaehlte hebt
 * sich; darunter das Format und die passende Hauptaktion.
 *
 * @fires back - Zurueck zur Uebersicht.
 */
export class StartPicker extends BaseElement {
  static override styles = [BaseElement.styles, startPickerStyles];

  @state() private option: StartOption = 'blank';
  @state() private format: SheetFormat = 'a4';
  @state() private exampleId = EXAMPLES[0]?.id ?? '';

  get #example() {
    return EXAMPLES.find((entry) => entry.id === this.exampleId) ?? EXAMPLES[0];
  }

  get #href(): string {
    const example = this.#example;
    if (this.option === 'example' && example)
      return editorHref({ kind: 'example', id: example.id });
    const route = { kind: 'new', format: this.format } as const;
    return editorHref(route, this.option === 'photo' ? 'photo' : 'lines');
  }

  #renderArt(option: StartOption): TemplateResult {
    if (option === 'blank')
      return html`<svg class="art" viewBox="0 0 82 116" aria-hidden="true">
        ${svg`<rect class="art-blank" x="1" y="1" width="80" height="114"></rect>`}
      </svg>`;
    if (option === 'photo')
      return html`<svg class="art" viewBox="0 0 82 116" aria-hidden="true">
        ${svg`<defs><pattern id="photo-hatch" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)"><rect class="art-photo" width="14" height="14"></rect><line class="art-photo-line" x1="0" y1="0" x2="0" y2="14"></line></pattern></defs>
        <rect width="82" height="116" fill="url(#photo-hatch)"></rect>
        <text class="art-label" x="41" y="62">${startText().picker.photoArt.toUpperCase()}</text>`}
      </svg>`;
    const example = this.#example;
    const lines = example ? cardData(example.text, '').lines : [];
    return html`<fl-crease-canvas
      class="art"
      mini
      label=${startText().picker.examplePattern}
      .lines=${lines}
      .highlighted=${lines.map((line) => line.id)}
    ></fl-crease-canvas>`;
  }

  #renderOption(option: StartOption, index: number): TemplateResult {
    const disabled = option === 'example' && EXAMPLES.length === 0;
    const text = startText().picker.options[option];
    return html`<label class=${this.option === option ? 'option chosen' : 'option'}>
      <input
        class="radio"
        type="radio"
        name="start"
        .value=${option}
        .checked=${this.option === option}
        ?disabled=${disabled}
        @change=${() => (this.option = option)}
      />
      <span class="art-frame">${this.#renderArt(option)}</span>
      <span class="option-body">
        <span class="option-number">${String(index + 1).padStart(2, '0')}</span>
        <span class="option-title">${text.title}</span>
        <span class="option-text">${text.text}</span>
      </span>
    </label>`;
  }

  #renderFormat(): TemplateResult {
    const locked = this.option === 'example';
    return html`<fieldset class="formats" ?disabled=${locked}>
      <legend class="formats-label">${startText().picker.format}</legend>
      ${FORMATS.map(
        (format) =>
          html`<label class=${this.format === format.value && !locked ? 'format on' : 'format'}>
            <input
              class="radio"
              type="radio"
              name="format"
              .value=${format.value}
              .checked=${this.format === format.value}
              @change=${() => (this.format = format.value)}
            />${format.label}
          </label>`,
      )}
      <label class="format">
        <input class="radio" type="radio" name="format" value="custom" disabled />${
          startText().picker.custom
        }
      </label>
    </fieldset>`;
  }

  /** Bei „Beispiel kopieren“ statt des Formats: welches der mitgelieferten Modelle. */
  #renderExamples(): TemplateResult {
    return html`<fieldset class="formats">
      <legend class="formats-label">${startText().picker.example}</legend>
      ${EXAMPLES.map(
        (example) =>
          html`<label class=${this.exampleId === example.id ? 'format on' : 'format'}>
            <input
              class="radio"
              type="radio"
              name="example"
              .value=${example.id}
              .checked=${this.exampleId === example.id}
              @change=${() => (this.exampleId = example.id)}
            />${example.title}
          </label>`,
      )}
    </fieldset>`;
  }

  protected override render(): TemplateResult {
    const text = startText().picker;
    const action = text.options[this.option].action;
    return html`
      <header class="head">
        <button
          class="back"
          type="button"
          aria-label=${text.backToOverview}
          @click=${() => emit(this, 'back')}
        >
          ←
        </button>
        <p class="head-label">${text.head}</p>
      </header>
      <main class="body">
        <h1 class="title">${text.titleFirst}<br />${text.titleSecond}</h1>
        <fieldset class="options">
          <legend class="hidden">${text.startKind}</legend>
          ${OPTIONS.map((option, index) => this.#renderOption(option, index))}
        </fieldset>
        ${this.option === 'example' ? this.#renderExamples() : this.#renderFormat()}
      </main>
      <footer class="foot">
        <a class="primary" href=${this.#href}>${action} <span aria-hidden="true">→</span></a>
      </footer>
    `;
  }
}
