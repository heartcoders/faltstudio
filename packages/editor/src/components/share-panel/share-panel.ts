import { html, nothing, svg, type PropertyValues, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import type { Tutorial } from '@faltstudio/core';
import { BaseElement } from '@faltstudio/ui';
import { absoluteHref, viewHref } from '../../state/route.js';
import { encodeShare, QR_LIMIT } from '../../state/share.js';
import { qrPath } from './qr-path.js';
import { sharePanelStyles } from './share-panel.styles.js';
import { stepsText } from '../../i18n/steps.js';

interface QrCode {
  readonly size: number;
  readonly path: string;
}

type ShareState =
  | { readonly kind: 'pending' }
  | { readonly kind: 'ready'; readonly link: string; readonly qr: QrCode | undefined }
  | { readonly kind: 'failed'; readonly reason: string };

const COPIED_MS = 1800;

async function buildQr(link: string): Promise<QrCode | undefined> {
  if (link.length > QR_LIMIT) return undefined;
  const { encode } = await import('uqr');
  const result = encode(link, { ecc: 'L', border: 2 });
  return { size: result.size, path: qrPath(result.data) };
}

/**
 * Teilen ohne Backend: Link mit dem ganzen Modell im Fragment, dazu ein
 * QR-Code zum Scannen mit dem Handy. Das Foto geht nicht mit.
 */
export class SharePanel extends BaseElement {
  static override styles = [BaseElement.styles, sharePanelStyles];

  @property({ attribute: false }) tutorial: Tutorial | undefined;
  @state() private share: ShareState = { kind: 'pending' };
  @state() private copied = false;

  #request = 0;
  #copiedTimer: ReturnType<typeof setTimeout> | undefined;

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    clearTimeout(this.#copiedTimer);
  }

  protected override willUpdate(changed: PropertyValues): void {
    if (changed.has('tutorial')) void this.#prepare();
  }

  async #prepare(): Promise<void> {
    const tutorial = this.tutorial;
    const request = ++this.#request;
    if (!tutorial) return;
    this.share = { kind: 'pending' };
    try {
      const payload = await encodeShare(tutorial);
      const link = absoluteHref(viewHref({ kind: 'shared', payload }));
      const qr = await buildQr(link);
      if (request === this.#request) this.share = { kind: 'ready', link, qr };
    } catch (error) {
      if (request !== this.#request) return;
      this.share = {
        kind: 'failed',
        reason: stepsText().share.failed(error instanceof Error ? error.message : String(error)),
      };
    }
  }

  async #handleCopy(link: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(link);
      this.copied = true;
      clearTimeout(this.#copiedTimer);
      this.#copiedTimer = setTimeout(() => (this.copied = false), COPIED_MS);
    } catch (error) {
      this.share = {
        kind: 'failed',
        reason: stepsText().share.copyDenied(
          error instanceof Error ? error.message : String(error),
        ),
      };
    }
  }

  async #handleNativeShare(link: string): Promise<void> {
    try {
      await navigator.share({
        title: this.tutorial?.meta.title ?? stepsText().share.fallbackTitle,
        url: link,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      throw error;
    }
  }

  #renderQr(qr: QrCode | undefined): TemplateResult {
    if (!qr) return html`<p class="too-large">${stepsText().share.tooLarge}</p>`;
    return html`<svg
      class="qr"
      viewBox="0 0 ${qr.size} ${qr.size}"
      role="img"
      aria-label=${stepsText().share.qrLabel}
      shape-rendering="crispEdges"
    >
      ${svg`<rect class="qr-light" width=${qr.size} height=${qr.size}></rect><path class="qr-dark" d=${qr.path}></path>`}
    </svg>`;
  }

  #renderReady(link: string, qr: QrCode | undefined): TemplateResult {
    const canShare = typeof navigator.share === 'function';
    return html`
      ${this.#renderQr(qr)}
      <p class="link" title=${link}>${link}</p>
      <p class="note">${stepsText().share.note}</p>
      <div class=${canShare ? 'actions two' : 'actions'}>
        <button class="button primary" type="button" @click=${() => void this.#handleCopy(link)}>
          ${this.copied ? stepsText().share.copied : stepsText().share.copy}
        </button>
        ${
          canShare
            ? html`<button
                class="button"
                type="button"
                @click=${() => void this.#handleNativeShare(link)}
              >
                ${stepsText().share.shareNative}
              </button>`
            : nothing
        }
      </div>
      <p class="visually-hidden" role="status">
        ${this.copied ? stepsText().share.copiedStatus : ''}
      </p>
    `;
  }

  protected override render(): TemplateResult {
    const share = this.share;
    if (share.kind === 'pending')
      return html`<div class="panel" aria-busy="true"><span class="qr placeholder"></span></div>`;
    if (share.kind === 'failed')
      return html`<div class="panel"><p class="too-large" role="alert">${share.reason}</p></div>`;
    return html`<div class="panel">${this.#renderReady(share.link, share.qr)}</div>`;
  }
}
