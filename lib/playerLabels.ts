import type { GameMode, PlayerId } from "@/lib/types";

export function getPlayerLabel(player: PlayerId, gameMode: GameMode): string {
  if (gameMode === "bot") return player === "p1" ? "You" : "Bot";
  return player === "p1" ? "Blue" : "Red";
}

export function getTurnMessage(player: PlayerId, gameMode: GameMode): string {
  const label = getPlayerLabel(player, gameMode);
  return label === "You" ? "Your Turn" : `${label}'s Turn`;
}
