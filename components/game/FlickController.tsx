"use client";

import { useCallback, useRef, type RefObject } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import type { RapierRigidBody } from "@react-three/rapier";
import { playSound } from "@/lib/audio/playSound";
import { MAX_DRAG_PIXELS, MAX_IMPULSE, MIN_DRAG_PIXELS } from "@/lib/physics/constants";
import { useGameStore } from "@/lib/store/gameStore";
import type { PlayerId } from "@/lib/types";

type ActiveDrag = {
  pointerId: number;
  startX: number;
  startY: number;
};

/**
 * Live drag position, read every frame by the aim-line/highlight visuals
 * instead of via React state — a drag updates far too often (pointermove)
 * to route through re-renders.
 */
export type DragVisualState = {
  active: boolean;
  originX: number;
  originY: number;
  currentX: number;
  currentY: number;
};

function createDragVisualState(): DragVisualState {
  return { active: false, originX: 0, originY: 0, currentX: 0, currentY: 0 };
}

/**
 * Tracks a pointer drag on one marble and converts the release delta into
 * an X/Z impulse, slingshot-style: pull back, release, marble launches the
 * opposite way. Screen-space delta maps directly onto world X/Z (no
 * unprojection) — see the comment on MAX_DRAG_PIXELS in physics/constants.
 */
export function useFlickController(
  rigidBodyRef: RefObject<RapierRigidBody | null>,
  playerId: PlayerId,
) {
  const activeDrag = useRef<ActiveDrag | null>(null);
  const dragVisual = useRef<DragVisualState>(createDragVisualState());

  const onPointerDown = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      const { phase, currentPlayer } = useGameStore.getState();
      if (phase !== "aiming" || currentPlayer !== playerId || activeDrag.current) return;

      event.stopPropagation();
      const { pointerId, clientX, clientY } = event.nativeEvent;
      activeDrag.current = { pointerId, startX: clientX, startY: clientY };
      dragVisual.current = { active: true, originX: clientX, originY: clientY, currentX: clientX, currentY: clientY };

      const endDrag = () => {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
        window.removeEventListener("pointercancel", handlePointerCancel);
        activeDrag.current = null;
        dragVisual.current.active = false;
      };

      const handlePointerMove = (moveEvent: PointerEvent) => {
        if (moveEvent.pointerId !== pointerId) return;
        dragVisual.current.currentX = moveEvent.clientX;
        dragVisual.current.currentY = moveEvent.clientY;
      };

      const handlePointerUp = (upEvent: PointerEvent) => {
        if (upEvent.pointerId !== pointerId) return;
        const drag = activeDrag.current;
        endDrag();
        if (!drag) return;

        const dx = upEvent.clientX - drag.startX;
        const dy = upEvent.clientY - drag.startY;
        const rawMagnitude = Math.hypot(dx, dy);
        if (rawMagnitude < MIN_DRAG_PIXELS) return;

        const clampedMagnitude = Math.min(rawMagnitude, MAX_DRAG_PIXELS);
        const impulseMagnitude = (clampedMagnitude / MAX_DRAG_PIXELS) * MAX_IMPULSE;
        // Slingshot pull-back: the marble launches opposite the drag, like
        // pulling back a slingshot and releasing — not swiping toward the target.
        const dirX = -dx / rawMagnitude;
        const dirZ = -dy / rawMagnitude;

        const rigidBody = rigidBodyRef.current;
        if (!rigidBody) return;

        rigidBody.wakeUp();
        rigidBody.applyImpulse({ x: dirX * impulseMagnitude, y: 0, z: dirZ * impulseMagnitude }, true);
        useGameStore.getState().startResolving();
        playSound("flick");
      };

      const handlePointerCancel = (cancelEvent: PointerEvent) => {
        if (cancelEvent.pointerId !== pointerId) return;
        endDrag();
      };

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
      window.addEventListener("pointercancel", handlePointerCancel);
    },
    [playerId, rigidBodyRef],
  );

  return { onPointerDown, dragVisual };
}
