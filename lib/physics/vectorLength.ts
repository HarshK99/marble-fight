type Vec3Like = { x: number; y: number; z: number };

export function vectorLength(v: Vec3Like): number {
  return Math.hypot(v.x, v.y, v.z);
}
