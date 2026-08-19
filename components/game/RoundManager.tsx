"use client";

import { useEffect, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import type { RapierRigidBody } from "@react-three/rapier";
import { playSound } from "@/lib/audio/playSound";
import {
  MARBLE_START_POSITIONS,
  SETTLE_FRAMES_REQUIRED,
  SETTLE_LINEAR_SPEED_EPSILON,
  SHAKE_INTENSITY_KNOCKOFF,
} from "@/lib/physics/constants";
import { isOffTable } from "@/lib/physics/offTableDetection";
import { useGameStore } from "@/lib/store/gameStore";
import type { PlayerId } from "@/lib/types";

type RoundManagerProps = {
  bodyRefs: Record<PlayerId, RefObject<RapierRigidBody | null>>;
};

function speedOf(body: RapierRigidBody): number {
  const v = body.linvel();
  return Math.hypot(v.x, v.y, v.z);
}

function resetMarble(body: RapierRigidBody, position: readonly [number, number, number]) {
  body.setTranslation({ x: position[0], y: position[1], z: position[2] }, true);
  body.setLinvel({ x: 0, y: 0, z: 0 }, true);
  body.setAngvel({ x: 0, y: 0, z: 0 }, true);
}

/**
 * Runs the physics-facing half of turn resolution: watches both marbles
 * while phase is "resolving" and either hands the turn back once they've
 * settled, or ends the round once one goes off table. Pure game rules
 * (scores, turn order, match end) live in the store — this only reads
 * physics state and calls into it.
 */
export default function RoundManager({ bodyRefs }: RoundManagerProps) {
  const settledFrames = useRef(0);
  const boardResetToken = useGameStore((state) => state.boardResetToken);
  const isFirstMount = useRef(true);

  // Mode switch / "Play Again" can happen mid-flight, outside the normal
  // knockoff-triggered reset below — this covers that path.
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    const p1Body = bodyRefs.p1.current;
    const p2Body = bodyRefs.p2.current;
    if (p1Body) resetMarble(p1Body, MARBLE_START_POSITIONS.p1);
    if (p2Body) resetMarble(p2Body, MARBLE_START_POSITIONS.p2);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only boardResetToken should retrigger this; refs are read fresh via closure regardless of dep list
  }, [boardResetToken]);

  useFrame(() => {
    if (useGameStore.getState().phase !== "resolving") {
      settledFrames.current = 0;
      return;
    }

    const p1Body = bodyRefs.p1.current;
    const p2Body = bodyRefs.p2.current;
    if (!p1Body || !p2Body) return;

    const p1Off = isOffTable(p1Body.translation());
    const p2Off = isOffTable(p2Body.translation());

    if (p1Off || p2Off) {
      settledFrames.current = 0;

      const loser: PlayerId | null = p1Off && p2Off ? null : p1Off ? "p1" : "p2";
      useGameStore.getState().scoreRound(loser);
      useGameStore.getState().triggerShake(SHAKE_INTENSITY_KNOCKOFF);
      playSound("knockoff");

      resetMarble(p1Body, MARBLE_START_POSITIONS.p1);
      resetMarble(p2Body, MARBLE_START_POSITIONS.p2);

      if (useGameStore.getState().phase === "roundEnd") {
        useGameStore.getState().beginNextRound();
      }
      return;
    }

    const bothSlow =
      speedOf(p1Body) < SETTLE_LINEAR_SPEED_EPSILON && speedOf(p2Body) < SETTLE_LINEAR_SPEED_EPSILON;

    if (!bothSlow) {
      settledFrames.current = 0;
      return;
    }

    settledFrames.current += 1;
    if (settledFrames.current >= SETTLE_FRAMES_REQUIRED) {
      settledFrames.current = 0;
      useGameStore.getState().endTurn();
    }
  });

  return null;
}
