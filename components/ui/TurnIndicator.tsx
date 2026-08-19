"use client";

import { getTurnMessage } from "@/lib/playerLabels";
import { useGameStore } from "@/lib/store/gameStore";

/**
 * Brief, mild "Your Turn" / "Bot's Turn" toast whenever a new turn starts.
 * Keyed on `turnToken` (increments every phase->"aiming" transition) so
 * remounting restarts the CSS fade — no JS timer/setState involved. Sits
 * in the top chrome strip, just below ScorePanel, rather than over the
 * play area — center-screen was distracting since it sat on top of the table.
 */
export default function TurnIndicator() {
  const phase = useGameStore((state) => state.phase);
  const currentPlayer = useGameStore((state) => state.currentPlayer);
  const gameMode = useGameStore((state) => state.gameMode);
  const turnToken = useGameStore((state) => state.turnToken);

  if (phase !== "aiming") return null;

  return (
    <div
      className="pointer-events-none absolute inset-x-0 z-10 flex justify-center px-4"
      style={{ top: "calc(max(0.75rem, env(safe-area-inset-top)) + 4.75rem)" }}
    >
      <div
        key={turnToken}
        className="animate-[turn-toast_1.3s_ease-out] rounded-full bg-black/45 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm"
      >
        {getTurnMessage(currentPlayer, gameMode)}
      </div>
    </div>
  );
}
