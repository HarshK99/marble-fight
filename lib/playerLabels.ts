import type { GameMode, PlayerId } from "@/lib/types";

export function getPlayerLabel(player: PlayerId, gameMode: GameMode): string {
  if (gameMode === "bot") return player === "p1" ? "You" : "Bot";
  return player === "p1" ? "Blue" : "Red";
}
