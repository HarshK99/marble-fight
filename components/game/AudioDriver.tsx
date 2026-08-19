"use client";

import type { RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import type { RapierRigidBody } from "@react-three/rapier";
import { setRollIntensity } from "@/lib/audio/playSound";
import { ROLL_SOUND_REFERENCE_SPEED } from "@/lib/physics/constants";
import { vectorLength } from "@/lib/physics/vectorLength";
import { useGameStore } from "@/lib/store/gameStore";
import type { PlayerId } from "@/lib/types";

type AudioDriverProps = {
  bodyRefs: Record<PlayerId, RefObject<RapierRigidBody | null>>;
};

/**
 * Drives the continuous roll sound from live marble speed — a per-frame
 * level, unlike the one-shot playSound() events fired elsewhere.
 */
export default function AudioDriver({ bodyRefs }: AudioDriverProps) {
  useFrame(() => {
    if (useGameStore.getState().phase !== "resolving") {
      setRollIntensity(0);
      return;
    }

    const p1Body = bodyRefs.p1.current;
    const p2Body = bodyRefs.p2.current;
    if (!p1Body || !p2Body) return;

    const maxSpeed = Math.max(vectorLength(p1Body.linvel()), vectorLength(p2Body.linvel()));
    setRollIntensity(maxSpeed / ROLL_SOUND_REFERENCE_SPEED);
  });

  return null;
}
