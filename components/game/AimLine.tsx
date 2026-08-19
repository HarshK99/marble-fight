"use client";

import { useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import type { RapierRigidBody } from "@react-three/rapier";
import { BufferAttribute, BufferGeometry, Float32BufferAttribute, Line, LineDashedMaterial } from "three";
import {
  AIM_LINE_DASH_GAP,
  AIM_LINE_DASH_SIZE,
  AIM_LINE_MAX_LENGTH,
  MARBLE_RADIUS,
  MAX_DRAG_PIXELS,
} from "@/lib/physics/constants";
import type { DragVisualState } from "./FlickController";

type AimLineProps = {
  dragVisual: RefObject<DragVisualState>;
  bodyRef: RefObject<RapierRigidBody | null>;
  color: string;
};

function createAimLine(color: string): Line {
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(new Float32Array(6), 3));
  const material = new LineDashedMaterial({
    color,
    dashSize: AIM_LINE_DASH_SIZE,
    gapSize: AIM_LINE_DASH_GAP,
    transparent: true,
    opacity: 0.9,
  });
  const line = new Line(geometry, material);
  line.visible = false;
  line.frustumCulled = false;
  return line;
}

/**
 * Dashed line from the marble outward along the live drag direction;
 * length scales with drag power (capped at AIM_LINE_MAX_LENGTH). Reads
 * drag state from a ref every frame rather than via the store — a drag
 * updates far more often than is worth pushing through React state.
 *
 * The line is a plain THREE.Line built once via lazy ref initialization
 * (React's sanctioned pattern for a mutable non-React object — see
 * https://react.dev/reference/react/useRef#avoiding-recreating-the-ref-contents)
 * rather than useMemo, since useFrame mutates it every frame and the
 * project's stricter eslint-plugin-react-hooks rules only allow that for
 * ref-owned values. Mounted via `<primitive>` rather than the JSX `<line>`
 * intrinsic: R3F's types rename it to `threeLine` to dodge the DOM's SVG
 * `<line>` element, but that rename is type-only — the runtime catalog
 * built from the THREE namespace has no `threeLine` entry, so the
 * intrinsic silently fails to resolve.
 */
export default function AimLine({ dragVisual, bodyRef, color }: AimLineProps) {
  const lineRef = useRef<Line | null>(null);
  if (lineRef.current === null) {
    lineRef.current = createAimLine(color);
  }
  // <primitive> needs the object itself to mount it — lazy ref init is
  // React's own sanctioned pattern for this (react.dev/reference/react/
  // useRef#avoiding-recreating-the-ref-contents); the compiler-oriented
  // react-hooks/refs rule doesn't yet special-case reading it back out here.
  // eslint-disable-next-line react-hooks/refs
  const line = lineRef.current;

  useFrame(() => {
    const body = bodyRef.current;
    if (!body) return;

    const drag = dragVisual.current;
    const dx = drag.active ? drag.currentX - drag.originX : 0;
    const dy = drag.active ? drag.currentY - drag.originY : 0;
    const rawMagnitude = Math.hypot(dx, dy);

    if (!drag.active || rawMagnitude < 1) {
      line.visible = false;
      return;
    }

    // Opposite of the drag — matches the slingshot pull-back-and-release
    // impulse direction in FlickController, so the line previews the shot.
    const clampedMagnitude = Math.min(rawMagnitude, MAX_DRAG_PIXELS);
    const dirX = -dx / rawMagnitude;
    const dirZ = -dy / rawMagnitude;
    const length = (clampedMagnitude / MAX_DRAG_PIXELS) * AIM_LINE_MAX_LENGTH;
    const startOffset = MARBLE_RADIUS + 0.05;

    const origin = body.translation();
    const positionAttribute = line.geometry.getAttribute("position") as BufferAttribute;
    const arr = positionAttribute.array as Float32Array;
    arr[0] = origin.x + dirX * startOffset;
    arr[1] = origin.y;
    arr[2] = origin.z + dirZ * startOffset;
    arr[3] = origin.x + dirX * (startOffset + length);
    arr[4] = origin.y;
    arr[5] = origin.z + dirZ * (startOffset + length);
    positionAttribute.needsUpdate = true;

    line.geometry.computeBoundingSphere();
    line.computeLineDistances();
    line.visible = true;
  });

  return <primitive object={line} />;
}
