import { DoubleSide, Mesh, MeshStandardMaterial, PlaneGeometry } from 'three';
import type { Sheet } from '../model/index.js';

/**
 * Das ungefaltete Blatt als Platzhalter, bis M2 die Flaechen aus der Faltengine liefert.
 * Die Geometrie wird so verschoben, dass der Ursprung wie im Datenmodell links unten liegt.
 */
export function createSheetMesh(sheet: Sheet): Mesh {
  const geometry = new PlaneGeometry(sheet.width, sheet.height);
  geometry.translate(sheet.width / 2, sheet.height / 2, 0);
  const material = new MeshStandardMaterial({ color: 0xd9d9d9, roughness: 0.9, side: DoubleSide });
  return new Mesh(geometry, material);
}
