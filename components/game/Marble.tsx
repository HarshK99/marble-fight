"use client";

import { useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, type CollisionEnterPayload, type RapierRigidBody } from "@react-three/rapier";
import type { MeshPhysicalMaterial } from "three";
import { playSound } from "@/lib/audio/playSound";
import {
  MARBLE_ANGULAR_DAMPING,
  MARBLE_FRICTION,
  MARBLE_LINEAR_DAMPING,
  MARBLE_RADIUS,
  MARBLE_RESTITUTION,
  SHAKE_INTENSITY_COLLISION,
} from "@/lib/physics/constants";
import { useGameStore } from "@/lib/store/gameStore";
import type { PlayerId } from "@/lib/types";
import AimLine from "./AimLine";
import { useFlickController } from "./FlickController";

type MarbleProps = {
  playerId: PlayerId;
  position: [number, number, number];
  color: string;
  bodyRef: RefObject<RapierRigidBody | null>;
};

const DRAG_GLOW_BASE = 0.45;
const DRAG_GLOW_PULSE = 0.15;
const DRAG_GLOW_SPEED = 8;

export default function Marble({ playerId, position, color, bodyRef }: MarbleProps) {
  const { onPointerDown, dragVisual } = useFlickController(bodyRef, playerId);
  const materialRef = useRef<MeshPhysicalMaterial>(null);

  useFrame((state) => {
    const material = materialRef.current;
    if (!material) return;
    material.emissiveIntensity = dragVisual.current.active
      ? DRAG_GLOW_BASE + Math.sin(state.clock.elapsedTime * DRAG_GLOW_SPEED) * DRAG_GLOW_PULSE
      : 0;
  });

  const handleCollisionEnter = (payload: CollisionEnterPayload) => {
    // Only react to marble-vs-marble contact (not the constant marble-vs-table
    // rolling contact), and only from one side so it fires once per hit.
    const otherIsMarble = payload.other.rigidBodyObject?.userData?.kind === "marble";
    if (otherIsMarble && playerId === "p1") {
      useGameStore.getState().triggerShake(SHAKE_INTENSITY_COLLISION);
      playSound("collision");
    }
  };

  return (
    <>
      <RigidBody
        ref={bodyRef}
        type="dynamic"
        colliders="ball"
        position={position}
        friction={MARBLE_FRICTION}
        restitution={MARBLE_RESTITUTION}
        linearDamping={MARBLE_LINEAR_DAMPING}
        angularDamping={MARBLE_ANGULAR_DAMPING}
        userData={{ kind: "marble" }}
        onCollisionEnter={handleCollisionEnter}
        canSleep
      >
        <mesh castShadow onPointerDown={onPointerDown}>
          <sphereGeometry args={[MARBLE_RADIUS, 32, 32]} />
          <meshPhysicalMaterial
            ref={materialRef}
            color={color}
            emissive={color}
            emissiveIntensity={0}
            roughness={0.05}
            metalness={0}
            clearcoat={1}
            clearcoatRoughness={0.05}
            transmission={0.15}
            thickness={0.6}
            ior={1.5}
            reflectivity={0.5}
          />
        </mesh>
      </RigidBody>

      <AimLine dragVisual={dragVisual} bodyRef={bodyRef} color={color} />
    </>
  );
}
