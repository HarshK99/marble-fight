"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { CAMERA_POSITION, SHAKE_DURATION_MS } from "@/lib/physics/constants";
import { useGameStore } from "@/lib/store/gameStore";

/**
 * Applies a short decaying jitter to the fixed camera on a shake event
 * (marble collision / knockoff — see gameStore's `shake`), then re-settles
 * it at its base position. No orbit/free camera — this only ever offsets
 * from CAMERA_POSITION for the duration of the shake.
 */
export default function CameraRig() {
  const camera = useThree((state) => state.camera);
  const shakeToken = useGameStore((state) => state.shake.token);
  const intensity = useRef(0);
  const shakeStartedAt = useRef<number | null>(null);

  useEffect(() => {
    if (shakeToken === 0) return; // skip the initial mount
    intensity.current = useGameStore.getState().shake.intensity;
    shakeStartedAt.current = performance.now();
  }, [shakeToken]);

  useFrame(() => {
    const startedAt = shakeStartedAt.current;
    const [baseX, baseY, baseZ] = CAMERA_POSITION;

    if (startedAt === null) {
      return;
    }

    const elapsed = performance.now() - startedAt;
    if (elapsed >= SHAKE_DURATION_MS) {
      shakeStartedAt.current = null;
      camera.position.set(baseX, baseY, baseZ);
      camera.lookAt(0, 0, 0);
      return;
    }

    const magnitude = intensity.current * (1 - elapsed / SHAKE_DURATION_MS);
    camera.position.set(
      baseX + (Math.random() - 0.5) * magnitude,
      baseY + (Math.random() - 0.5) * magnitude * 0.5,
      baseZ + (Math.random() - 0.5) * magnitude,
    );
    camera.lookAt(0, 0, 0);
  });

  return null;
}
