export type PlayerId = "p1" | "p2";

export type GamePhase = "aiming" | "resolving" | "roundEnd" | "matchEnd";

export type MatchConfig = {
  /** Number of rounds in the match; a player wins at ceil(bestOf / 2) round wins. */
  bestOf: number;
};
