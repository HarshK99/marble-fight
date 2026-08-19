import { create } from "zustand";
import { DEFAULT_BEST_OF } from "@/lib/physics/constants";
import type { GamePhase, MatchConfig, PlayerId } from "@/lib/types";

function otherPlayer(player: PlayerId): PlayerId {
  return player === "p1" ? "p2" : "p1";
}

type ShakeEvent = {
  /** Increments on every trigger so a repeat with the same intensity is still detectable. */
  token: number;
  intensity: number;
};

type GameStore = {
  currentPlayer: PlayerId;
  phase: GamePhase;
  scores: Record<PlayerId, number>;
  round: number;
  matchConfig: MatchConfig;
  winner: PlayerId | null;
  shake: ShakeEvent;

  /** Called once a flick's impulse has been applied; locks input until the turn resolves. */
  startResolving: () => void;
  /** Both marbles settled with neither knocked off: hand the turn to the other player. */
  endTurn: () => void;
  /**
   * A marble went off table. `loser` is the player who lost their marble, or
   * null if both went off in the same resolution (no one scores that round).
   */
  scoreRound: (loser: PlayerId | null) => void;
  /** Called after the board has been physically reset following a roundEnd. */
  beginNextRound: () => void;
  /** Resets full match state (scores, round, phase) — does not touch marble positions. */
  resetMatch: () => void;
  /** Fires a short decaying camera-shake pulse (see CameraRig); intensity is a small world-unit magnitude. */
  triggerShake: (intensity: number) => void;
};

const initialScores: Record<PlayerId, number> = { p1: 0, p2: 0 };

export const useGameStore = create<GameStore>((set, get) => ({
  currentPlayer: "p1",
  phase: "aiming",
  scores: { ...initialScores },
  round: 1,
  matchConfig: { bestOf: DEFAULT_BEST_OF },
  winner: null,
  shake: { token: 0, intensity: 0 },

  startResolving: () => set({ phase: "resolving" }),

  endTurn: () => {
    if (get().phase !== "resolving") return;
    set((state) => ({ phase: "aiming", currentPlayer: otherPlayer(state.currentPlayer) }));
  },

  scoreRound: (loser) => {
    const { phase, scores, matchConfig, round, currentPlayer } = get();
    if (phase !== "resolving") return;

    const roundWinner = loser ? otherPlayer(loser) : null;
    const nextScores = roundWinner ? { ...scores, [roundWinner]: scores[roundWinner] + 1 } : scores;

    const majority = Math.ceil(matchConfig.bestOf / 2);
    const matchWinner = roundWinner && nextScores[roundWinner] >= majority ? roundWinner : null;

    set({
      scores: nextScores,
      phase: matchWinner ? "matchEnd" : "roundEnd",
      winner: matchWinner,
      // Loser flicks first next round; if no one was knocked off, turn order is unaffected.
      currentPlayer: loser ?? currentPlayer,
      round: matchWinner ? round : round + 1,
    });
  },

  beginNextRound: () => {
    if (get().phase !== "roundEnd") return;
    set({ phase: "aiming" });
  },

  resetMatch: () =>
    set({
      currentPlayer: "p1",
      phase: "aiming",
      scores: { ...initialScores },
      round: 1,
      winner: null,
    }),

  triggerShake: (intensity) =>
    set((state) => ({ shake: { token: state.shake.token + 1, intensity } })),
}));
