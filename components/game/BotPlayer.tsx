"use client";

import { useEffect, type RefObject } from "react";
import type { RapierRigidBody } from "@react-three/rapier";
import { chooseBotShot } from "@/lib/ai/chooseBotShot";
import { playSound } from "@/lib/audio/playSound";
import { BOT_PLAYER, BOT_THINK_DELAY_MS } from "@/lib/physics/constants";
import { useGameStore } from "@/lib/store/gameStore";
import type { PlayerId } from "@/lib/types";

type BotPlayerProps = {
  bodyRefs: Record<PlayerId, RefObject<RapierRigidBody | null>>;
};

/**
 * The bot's "input source" for BOT_PLAYER — the same seam a human's
 * FlickController plugs into: after a short delay it picks a shot and
 * calls applyImpulse + startResolving + playSound("flick"), exactly like
 * a pointer-driven flick. Rules (scoring, turn order) stay entirely in the
 * store/RoundManager; this only decides *when* and *where* to shoot.
 */
export default function BotPlayer({ bodyRefs }: BotPlayerProps) {
  const gameMode = useGameStore((state) => state.gameMode);
  const phase = useGameStore((state) => state.phase);
  const currentPlayer = useGameStore((state) => state.currentPlayer);

  useEffect(() => {
    if (gameMode !== "bot" || phase !== "aiming" || currentPlayer !== BOT_PLAYER) return;

    const timer = setTimeout(() => {
      // Re-check: guards a stale timer if something else changed state first.
      const state = useGameStore.getState();
      if (state.gameMode !== "bot" || state.phase !== "aiming" || state.currentPlayer !== BOT_PLAYER) {
        return;
      }

      const botBody = bodyRefs[BOT_PLAYER].current;
      const targetBody = bodyRefs[BOT_PLAYER === "p1" ? "p2" : "p1"].current;
      if (!botBody || !targetBody) return;

      const shot = chooseBotShot(botBody.translation(), targetBody.translation());

      botBody.wakeUp();
      botBody.applyImpulse({ x: shot.x, y: 0, z: shot.z }, true);
      useGameStore.getState().startResolving();
      playSound("flick");
    }, BOT_THINK_DELAY_MS);

    return () => clearTimeout(timer);
  }, [gameMode, phase, currentPlayer, bodyRefs]);

  return null;
}
