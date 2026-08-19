import { TABLE } from "./constants";

type Vec3Like = { x: number; y: number; z: number };

/**
 * A marble is "off table" once its center has crossed the table's edge
 * (no collider supports it beyond that point, so it's already falling) or
 * once it has dropped below the table's Y threshold.
 */
export function isOffTable(position: Vec3Like): boolean {
  const halfWidth = TABLE.width / 2;
  const halfLength = TABLE.length / 2;
  const outsideXZ = Math.abs(position.x) > halfWidth || Math.abs(position.z) > halfLength;
  const belowY = position.y < TABLE.offTableYThreshold;
  return outsideXZ || belowY;
}
