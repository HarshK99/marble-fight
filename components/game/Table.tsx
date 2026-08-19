"use client";

/**
 * Road surface material — Poly Haven "Asphalt 04" (2K).
 *
 * Expects these three files in /public/textures/road/:
 *   - asphalt_04_diff_2k.jpg    (diffuse/color map)
 *   - asphalt_04_nor_gl_2k.jpg  (normal map, OpenGL format)
 *   - asphalt_04_rough_2k.jpg   (roughness map)
 */

import { useMemo, Suspense } from "react";
import { useTexture } from "@react-three/drei";
import { RepeatWrapping, SRGBColorSpace, type Texture } from "three";
import { TABLE } from "@/lib/physics/constants";

// World units covered by one texture tile before it repeats.
const TEXTURE_TILE_SIZE = 2;

function configureTile(source: Texture, colorSpace?: typeof SRGBColorSpace): Texture {
  // useTexture caches and reuses the loaded Texture instance, so mutating it
  // in place would affect every consumer — clone before configuring this one.
  const map = source.clone();
  if (colorSpace) map.colorSpace = colorSpace;
  map.wrapS = map.wrapT = RepeatWrapping;
  map.repeat.set(TABLE.width / TEXTURE_TILE_SIZE, TABLE.length / TEXTURE_TILE_SIZE);
  map.needsUpdate = true;
  return map;
}

function AsphaltMaterial() {
  const [diffuseSource, normalSource, roughnessSource] = useTexture([
    "/textures/road/asphalt_04_diff_2k.jpg",
    "/textures/road/asphalt_04_nor_gl_2k.jpg",
    "/textures/road/asphalt_04_rough_2k.jpg",
  ]);

  // Only the diffuse map holds color data — normal/roughness maps must stay
  // in linear space or their values get misinterpreted as sRGB-encoded.
  const diffuseMap = useMemo(() => configureTile(diffuseSource, SRGBColorSpace), [diffuseSource]);
  const normalMap = useMemo(() => configureTile(normalSource), [normalSource]);
  const roughnessMap = useMemo(() => configureTile(roughnessSource), [roughnessSource]);

  return <meshStandardMaterial map={diffuseMap} normalMap={normalMap} roughnessMap={roughnessMap} />;
}

export default function Table() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[TABLE.width, TABLE.length]} />
      {/* Local Suspense keeps the rest of the (already-loaded) scene visible
          while the road textures stream in, instead of blanking the whole
          Canvas via its default top-level Suspense boundary. */}
      <Suspense fallback={<meshStandardMaterial color="#3a3a3a" roughness={0.9} />}>
        <AsphaltMaterial />
      </Suspense>
    </mesh>
  );
}
