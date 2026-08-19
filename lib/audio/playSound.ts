export type SoundName = "flick" | "collision" | "knockoff";

/**
 * Stub — no real audio assets in this MVP (see PRD non-goals). Swap the
 * body for actual playback later without touching call sites.
 */
export function playSound(name: SoundName): void {
  console.log(`[sound] ${name}`);
}
