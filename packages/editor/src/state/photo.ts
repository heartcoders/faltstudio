import {
  applyHomography,
  invertHomography,
  photoToSheet,
  type Quad,
  type Reference,
  type Sheet,
} from '@faltstudio/core';
import { editorText } from '../i18n/editor.js';

const MAX_EDGE_PX = 2048;
const JPEG_QUALITY = 0.85;
/** Aufloesung der entzerrten Vorlage: 4 px je mm, fuer A4 also 840 × 1188 px. */
const RECTIFIED_PX_PER_MM = 4;

export interface LoadedImage {
  readonly dataUrl: string;
  readonly size: readonly [number, number];
}

function decode(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(editorText().messages.imageUnreadable));
    image.src = source;
  });
}

function context2d(width: number, height: number): CanvasRenderingContext2D {
  const canvas = Object.assign(document.createElement('canvas'), { width, height });
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error(editorText().messages.canvasMissing);
  return context;
}

/** Liest ein Bild und verkleinert es auf hoechstens 2048 px Kantenlaenge (JPEG). */
export async function loadImageFile(file: Blob): Promise<LoadedImage> {
  const url = URL.createObjectURL(file);
  try {
    const image = await decode(url);
    const scale = Math.min(1, MAX_EDGE_PX / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.round(image.naturalWidth * scale);
    const height = Math.round(image.naturalHeight * scale);
    const context = context2d(width, height);
    context.drawImage(image, 0, 0, width, height);
    return { dataUrl: context.canvas.toDataURL('image/jpeg', JPEG_QUALITY), size: [width, height] };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function sampler(
  pixels: ImageData,
): (x: number, y: number, out: Uint8ClampedArray, offset: number) => void {
  const { data, width, height } = pixels;
  return (x, y, out, offset) => {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    if (x0 < 0 || y0 < 0 || x0 >= width - 1 || y0 >= height - 1) return;
    const fx = x - x0;
    const fy = y - y0;
    for (let channel = 0; channel < 4; channel++) {
      const at = (dx: number, dy: number): number =>
        data[((y0 + dy) * width + x0 + dx) * 4 + channel] as number;
      const top = at(0, 0) * (1 - fx) + at(1, 0) * fx;
      const bottom = at(0, 1) * (1 - fx) + at(1, 1) * fx;
      out[offset + channel] = top * (1 - fy) + bottom * fy;
    }
  };
}

/**
 * Entzerrt das Foto auf das Blatt: fuer jeden Zielpixel den Blattpunkt ueber
 * die umgekehrte Homographie im Foto nachschlagen und bilinear abtasten.
 */
export async function rectify(reference: Reference, sheet: Sheet): Promise<string> {
  const image = await decode(reference.imageDataUrl);
  const source = context2d(reference.size[0], reference.size[1]);
  source.drawImage(image, 0, 0, reference.size[0], reference.size[1]);
  const sample = sampler(source.getImageData(0, 0, reference.size[0], reference.size[1]));
  const toPhoto = invertHomography(photoToSheet(reference.corners as Quad, sheet));
  const width = Math.round(sheet.width * RECTIFIED_PX_PER_MM);
  const height = Math.round(sheet.height * RECTIFIED_PX_PER_MM);
  const target = context2d(width, height);
  const output = target.createImageData(width, height);
  for (let row = 0; row < height; row++) {
    for (let column = 0; column < width; column++) {
      const [x, y] = applyHomography(toPhoto, [
        (column + 0.5) / RECTIFIED_PX_PER_MM,
        sheet.height - (row + 0.5) / RECTIFIED_PX_PER_MM,
      ]);
      sample(x, y, output.data, (row * width + column) * 4);
    }
  }
  target.putImageData(output, 0, 0);
  return target.canvas.toDataURL('image/jpeg', JPEG_QUALITY);
}

/** Merkt sich die entzerrte Vorlage je Referenz-Snapshot; meldet fertige Ergebnisse per Callback. */
export class RectifiedCache {
  #key: Reference | undefined;
  #sheet: Sheet | undefined;
  #value: string | undefined;
  readonly #notify: () => void;

  constructor(notify: () => void) {
    this.#notify = notify;
  }

  get(reference: Reference | undefined, sheet: Sheet): string | undefined {
    if (!reference) return undefined;
    if (reference === this.#key && sheet === this.#sheet) return this.#value;
    this.#key = reference;
    this.#sheet = sheet;
    this.#value = undefined;
    void rectify(reference, sheet).then(
      (value) => {
        if (this.#key !== reference) return;
        this.#value = value;
        this.#notify();
      },
      () => undefined,
    );
    return undefined;
  }
}
