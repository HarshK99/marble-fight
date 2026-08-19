import {
  BOT_AIM_JITTER_RADIANS,
  BOT_MAX_POWER_FRACTION,
  BOT_MIN_POWER_FRACTION,
  MAX_IMPULSE,
} from "@/lib/physics/constants";

export type Vec2 = { x: number; z: number };

/**
 * Deliberately simple bot aim: point at the opponent, rotate by a random
 * error within ±BOT_AIM_JITTER_RADIANS, scale by a random power fraction.
 * No lookahead, no rebound math — just enough to be a beatable opponent.
 */
export function chooseBotShot(botPosition: Vec2, targetPosition: Vec2): Vec2 {
  const dx = targetPosition.x - botPosition.x;
  const dz = targetPosition.z - botPosition.z;
  const distance = Math.hypot(dx, dz);
  const baseAngle = distance > 0 ? Math.atan2(dz, dx) : 0;

  const angle = baseAngle + (Math.random() * 2 - 1) * BOT_AIM_JITTER_RADIANS;
  const powerFraction =
    BOT_MIN_POWER_FRACTION + Math.random() * (BOT_MAX_POWER_FRACTION - BOT_MIN_POWER_FRACTION);
  const magnitude = powerFraction * MAX_IMPULSE;

  return {
    x: Math.cos(angle) * magnitude,
    z: Math.sin(angle) * magnitude,
  };
}
