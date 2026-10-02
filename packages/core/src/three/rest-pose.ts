import { Matrix4, Quaternion, Vector3, type Object3D } from 'three';
import type { RestPose } from '../fold/pose.js';

/**
 * Setzt die Praesentationsdrehung anteilig (0 = gefaltet wie berechnet,
 * 1 = Ruhelage). Zwischenlagen drehen um den festen Punkt der Ruhelage.
 */
export function applyRestPose(content: Object3D, pose: RestPose | undefined, amount: number): void {
  if (!pose || amount <= 0) {
    content.position.set(0, 0, 0);
    content.quaternion.identity();
    return;
  }
  const [a, b, c, d, e, f, g, h, i] = pose.transform.r;
  const full = new Quaternion().setFromRotationMatrix(
    new Matrix4().set(a, b, c, 0, d, e, f, 0, g, h, i, 0, 0, 0, 0, 1),
  );
  const partial = new Quaternion().slerp(full, Math.min(1, amount));
  const pivot = new Vector3(...pose.pivot);
  content.quaternion.copy(partial);
  content.position.copy(pivot).sub(pivot.clone().applyQuaternion(partial));
}
