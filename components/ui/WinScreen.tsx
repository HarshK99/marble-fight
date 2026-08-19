"use client";

import { PLAYER_COLORS } from "@/lib/physics/constants";
import { useGameStore } from "@/lib/store/gameStore";
import type { PlayerId } from "@/lib/types";

const PLAYER_LABELS: Record<PlayerId, string> = { p1: "Blue", p2: "Red" };

export default function WinScreen() {
  const phase = useGameStore((state) => state.phase);
  const winner = useGameStore((state) => state.winner);
  const scores = useGameStore((state) => state.scores);
  const resetMatch = useGameStore((state) => state.resetMatch);

  if (phase !== "matchEnd" || !winner) return null;

  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 px-6"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="flex w-full max-w-xs flex-col items-center gap-5 rounded-3xl bg-neutral-900 px-6 py-8 text-center shadow-xl">
        <span className="h-4 w-4 rounded-full" style={{ backgroundColor: PLAYER_COLORS[winner] }} />
        <h1 className="text-2xl font-bold text-white">{PLAYER_LABELS[winner]} wins!</h1>
        <p className="tabular-nums text-sm text-white/70">
          Final score {scores.p1} – {scores.p2}
        </p>
        <button
          type="button"
          onClick={resetMatch}
          className="mt-2 min-h-[44px] w-full rounded-full bg-white px-6 py-3 text-base font-semibold text-black transition-transform active:scale-95"
        >
          Play Again
        </button>
      </div>
    </div>
  );
}
