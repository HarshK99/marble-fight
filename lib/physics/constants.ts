import type { PlayerId } from "@/lib/types";

// Table extents (world units) on the XZ plane; Y is up. Marbles start near
// opposite ends along Z. Used by the scene, camera framing, and off-table
// bounds detection, so it stays a single source of truth.
export const TABLE = {
  width: 4,
  length: 8,
  surfaceY: 0,
  offTableYThreshold: -2,
} as const;

export const MARBLE_RADIUS = 0.28;

// Marbles need to feel distinctly lighter/bouncier than a default Rapier
// body: low friction so they keep rolling, high restitution so collisions
// stay lively instead of deadening on contact.
export const MARBLE_FRICTION = 0.15;
export const MARBLE_RESTITUTION = 0.75;

// Rapier's contact friction barely decelerates a sphere once it's rolling
// without slipping (friction only resists sliding, not steady rolling), so
// a marble effectively coasts at near-constant speed unless damped directly.
// Without this, drag distance stops mattering — even a bare-minimum flick
// crosses the whole table. Damping gives real speed-vs-distance control.
export const MARBLE_LINEAR_DAMPING = 0.6;
export const MARBLE_ANGULAR_DAMPING = 0.5;

export const TABLE_FRICTION = 0.6;
export const TABLE_RESTITUTION = 0.3;

const START_MARGIN = 1.25;

export const MARBLE_START_POSITIONS: Record<PlayerId, [number, number, number]> = {
  p1: [0, MARBLE_RADIUS + 0.05, TABLE.length / 2 - START_MARGIN],
  p2: [0, MARBLE_RADIUS + 0.05, -(TABLE.length / 2 - START_MARGIN)],
};

export const PLAYER_COLORS: Record<PlayerId, string> = {
  p1: "#3b82f6",
  p2: "#ef4444",
};

// Flick gesture tuning: a screen-space drag delta (in CSS pixels) maps
// directly to an X/Z impulse — no camera unprojection, since the fixed
// camera has no roll/yaw and its right/forward axes line up with world X/Z.
export const MAX_DRAG_PIXELS = 140;
export const MIN_DRAG_PIXELS = 6;
export const MAX_IMPULSE = 2.2;

// A flick's turn only resolves once both marbles' linear speed stays below
// this for several consecutive frames — a single instantaneous low reading
// (e.g. mid-bounce) shouldn't count as "settled".
export const SETTLE_LINEAR_SPEED_EPSILON = 0.05;
export const SETTLE_FRAMES_REQUIRED = 15;

export const DEFAULT_BEST_OF = 5;

// Fixed angled top-down camera — shared between GameCanvas (base position)
// and CameraRig (shake offsets from this same base), so they can't drift
// out of sync.
export const CAMERA_POSITION: readonly [number, number, number] = [0, 9, 6];
export const CAMERA_FOV = 45;

// Camera shake ("juice"): a short decaying jitter, stronger on a knockoff
// than on a plain marble-marble collision.
export const SHAKE_DURATION_MS = 350;
export const SHAKE_INTENSITY_COLLISION = 0.05;
export const SHAKE_INTENSITY_KNOCKOFF = 0.18;

// Aim line ("juice"): dashed line from the marble outward along the drag
// direction, length scales with drag power up to this world-unit cap.
export const AIM_LINE_MAX_LENGTH = 1.6;
export const AIM_LINE_DASH_SIZE = 0.12;
export const AIM_LINE_DASH_GAP = 0.08;

// Which player slot the bot controls in "bot" game mode.
export const BOT_PLAYER: PlayerId = "p2";

// Bot shot selection: aim at the opponent with some random error rather
// than a laser-precise aimbot, so it's simple and beatable.
export const BOT_THINK_DELAY_MS = 900;
export const BOT_AIM_JITTER_RADIANS = Math.PI / 10.5; // ~17 degrees
export const BOT_MIN_POWER_FRACTION = 0.55;
export const BOT_MAX_POWER_FRACTION = 0.95;
