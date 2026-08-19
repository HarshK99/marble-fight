"use client";

import { Suspense, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, Environment, PerspectiveCamera } from "@react-three/drei";
import { CuboidCollider, Physics, RigidBody, type RapierRigidBody } from "@react-three/rapier";
import {
  CAMERA_FOV,
  CAMERA_POSITION,
  MARBLE_START_POSITIONS,
  PLAYER_COLORS,
  TABLE,
  TABLE_FRICTION,
  TABLE_RESTITUTION,
} from "@/lib/physics/constants";
import type { PlayerId } from "@/lib/types";
import CameraRig from "./CameraRig";
import Marble from "./Marble";
import RoundManager from "./RoundManager";
import Table from "./Table";

export default function GameCanvas() {
  const p1Ref = useRef<RapierRigidBody>(null);
  const p2Ref = useRef<RapierRigidBody>(null);
  const bodyRefs: Record<PlayerId, typeof p1Ref> = { p1: p1Ref, p2: p2Ref };

  return (
    <div className="game-canvas-layer absolute inset-0">
      <Canvas shadows>
        <PerspectiveCamera
          makeDefault
          position={CAMERA_POSITION}
          fov={CAMERA_FOV}
          onUpdate={(camera) => camera.lookAt(0, 0, 0)}
        />
        <CameraRig />

        <ambientLight intensity={0.4} />
        <directionalLight
          position={[4, 10, 4]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        {/* Isolated so its external HDR fetch can't hold up mounting the
            physics world and marbles behind Canvas's default Suspense —
            reflections fade in a beat after the scene is already interactive. */}
        <Suspense fallback={null}>
          <Environment preset="city" />
        </Suspense>

        <Physics>
          <RigidBody
            type="fixed"
            colliders={false}
            friction={TABLE_FRICTION}
            restitution={TABLE_RESTITUTION}
          >
            {/* Collider is a thin slab under the visual plane rather than an
                auto-collider from the (zero-thickness) plane geometry, which
                Rapier handles unreliably. */}
            <CuboidCollider args={[TABLE.width / 2, 0.1, TABLE.length / 2]} position={[0, -0.1, 0]} />

            <Table />
          </RigidBody>

          <Marble
            playerId="p1"
            position={MARBLE_START_POSITIONS.p1}
            color={PLAYER_COLORS.p1}
            bodyRef={p1Ref}
          />
          <Marble
            playerId="p2"
            position={MARBLE_START_POSITIONS.p2}
            color={PLAYER_COLORS.p2}
            bodyRef={p2Ref}
          />

          <RoundManager bodyRefs={bodyRefs} />
        </Physics>

        <ContactShadows
          position={[0, 0.01, 0]}
          opacity={0.5}
          scale={10}
          blur={2}
          far={4}
        />
      </Canvas>
    </div>
  );
}
