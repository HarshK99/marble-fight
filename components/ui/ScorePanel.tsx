"use client";

import { PLAYER_COLORS } from "@/lib/physics/constants";
import { getPlayerLabel } from "@/lib/playerLabels";
import { useGameStore } from "@/lib/store/gameStore";
import type { PlayerId } from "@/lib/types";

const PLAYER_ORDER: readonly PlayerId[] = ["p1", "p2"];

export default function ScorePanel() {
  const scores = useGameStore((state) => state.scores);
  const currentPlayer = useGameStore((state) => state.currentPlayer);
  const round = useGameStore((state) => state.round);
  const phase = useGameStore((state) => state.phase);
  const gameMode = useGameStore((state) => state.gameMode);

  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center px-4"
      style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
    >
      <div className="flex items-center gap-4 rounded-2xl bg-black/40 px-4 py-2 backdrop-blur-sm">
        {PLAYER_ORDER.map((player) => (
          <div key={player} className="flex min-w-14 flex-col items-center gap-0.5">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{
                backgroundColor: PLAYER_COLORS[player],
                opacity: phase === "aiming" && currentPlayer === player ? 1 : 0.35,
              }}
            />
            <span className="text-lg font-semibold tabular-nums text-white">{scores[player]}</span>
            <span className="text-[10px] uppercase tracking-wide text-white/60">
              {getPlayerLabel(player, gameMode)}
            </span>
          </div>
        ))}

        <div className="ml-2 flex flex-col items-center border-l border-white/15 pl-4">
          <span className="text-[10px] uppercase tracking-wide text-white/50">Round</span>
          <span className="text-sm font-medium tabular-nums text-white/80">{round}</span>
        </div>
      </div>
    </div>
  );
}
