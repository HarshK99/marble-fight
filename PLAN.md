# Marble Fight — Implementation Plan

Companion to [PRD.md](./PRD.md). Scoped from `starter.txt`.

> Before writing code: per `AGENTS.md`, this repo is on Next.js 16.3.1 with App Router — check `node_modules/next/dist/docs/01-app/` for anything that differs from training-data assumptions (routing, `"use client"` boundaries, config, image/asset handling) before implementing.

## 0. Prerequisites / Open Decisions
Resolved (see PRD "Open Questions"):
- Turn order after a round ends: **loser of the round flicks first next round** (decided 2026-08-19).
- Table dimensions and off-table Y/XZ bounds: `TABLE.width = 4`, `TABLE.length = 8`, `offTableYThreshold = -2` (`lib/physics/constants.ts`, decided in Phase 1).
- Stalemate fallback: not needed — turns alternate after every flick settles regardless of outcome (PRD: "marbles at rest, or one has been knocked off"); only a knockoff ends the *round* and resets positions. Marbles keep their resting position between flicks within a round.
- Texture files: fetched from Poly Haven's public API in Phase 3, present in `/public/textures/road/`.

## 1. Dependencies
Install:
- `three`
- `@react-three/fiber`
- `@react-three/drei`
- `@react-three/rapier`
- `zustand`

Tailwind is already present (v4, via `@tailwindcss/postcss`) — confirm the existing setup supports the safe-area utilities needed, or add small custom CSS for `env(safe-area-inset-*)` if Tailwind v4 doesn't expose it by default.

## 2. Code Structure
```
app/
  layout.tsx              (existing — verify viewport meta / safe-area setup)
  page.tsx                (mounts the game shell)
  globals.css              (touch-action, safe-area CSS vars if needed)
components/
  game/
    GameCanvas.tsx          "use client" — R3F <Canvas>, camera, lights, environment
    Table.tsx                road plane + asphalt material (texture comment block here)
    Marble.tsx                one marble: RigidBody + mesh + drag handling
    FlickController.tsx      pointer/touch tracking → impulse application (or hook)
    ContactShadowsLayer.tsx  (or inline in GameCanvas)
    CameraRig.tsx            fixed angled top-down camera + shake/zoom-punch effect
  ui/
    ScorePanel.tsx           score + round/match display, safe-area aware
    WinScreen.tsx             match end modal, "Play Again"
    TurnIndicator.tsx        (optional) whose turn it is
lib/
  store/
    gameStore.ts             Zustand store: scores, turn, round, match config, phase (aiming/resolving/roundEnd/matchEnd)
  physics/
    constants.ts              friction/restitution/impulse-cap/table-bounds constants
    offTableDetection.ts      helper: given rigid body position, is it off-table?
  audio/
    playSound.ts               stub hook, e.g. playSound(name: SoundName) => void (console.log for now)
  types.ts                    shared types: PlayerId, GamePhase, MatchConfig, etc.
public/
  textures/road/              (user-provided texture files land here)
```

Rationale for the split: `lib/store` + `lib/physics` + `lib/types` have zero React/R3F imports, so game rules (turn logic, scoring, off-table detection, impulse math) are unit-testable and swappable independent of rendering. `components/game/*` only reads/writes the store and renders — this is the seam where AI or networked-multiplayer input would later plug in (replace `FlickController`'s human-input source without touching scoring/physics).

## 3. Build Order (phases)

**Phase 1 — Scaffolding & static scene**
- Install deps, set up `app/layout.tsx` viewport meta (`viewport-fit=cover` for safe-area), global CSS (`touch-action: none` on canvas container).
- `GameCanvas.tsx` with fixed camera, `<Environment preset="city">`, directional light w/ shadows, empty road plane (solid color placeholder color, not texture, temporarily) to confirm framing on a 390px-wide viewport first.

**Phase 2 — Physics & marbles**
- Add `@react-three/rapier` `<Physics>` world, two `RigidBody` ball colliders at opposite table ends with `MeshPhysicalMaterial` marbles (glassy look, per-player color).
- Tune friction/restitution constants (`lib/physics/constants.ts`) for marble feel.
- Verify marbles rest naturally on the plane with correct collider radius.

**Phase 3 — Road material**
- Implement `useTexture` load of the three asphalt maps with the required comment block on expected paths; set `repeat`/`wrapS`/`wrapT` (`THREE.RepeatWrapping`) sized to table dimensions.
- Guard against missing texture files (try/catch or Suspense fallback) so a fresh clone without the manual asset drop doesn't hard-crash — degrade to a plain material.
- Add `<ContactShadows>` under marbles.

**Phase 4 — Flick input**
- `FlickController` (pointer events on the canvas or per-marble mesh): pointerdown records start, pointermove optionally drives a drag-trail visual, pointerup computes delta → normalized direction × capped magnitude → `applyImpulse` on the corresponding `RigidBody` (X/Z only, screen-space mapped, no unprojection).
- Gate: only accept input for the active player's marble, only when game phase is "aiming".
- Add `touch-action: none` on canvas element/container.

**Phase 5 — Game state & rules**
- `gameStore.ts` (Zustand): `scores`, `currentPlayer`, `round`, `matchConfig.bestOf`, `phase`.
- Turn resolution: after impulse applied, transition to "resolving"; poll/subscribe to both rigid bodies' linear velocity to detect "settled" (below epsilon for N frames) → transition back to "aiming" for the other player, OR detect off-table first.
- Off-table detection (`lib/physics/offTableDetection.ts`) run every physics step (or on an interval) against both marbles' translation; on trigger, increment score, set `phase = "roundEnd"`.
- Round reset: reposition both marbles to start positions, reset velocities, resume "aiming" for next player per turn-order decision (Phase 0).
- Match end check: when either player's score reaches ceil(bestOf/2), set `phase = "matchEnd"`.

**Phase 6 — UI layer**
- `ScorePanel.tsx`: current scores, round number, whose turn — Tailwind, safe-area padding, sits over the canvas (absolute/fixed positioned, pointer-events scoped so it doesn't block canvas drags outside its own area).
- `WinScreen.tsx`: shown when `phase === "matchEnd"`, final score + "Play Again" button (44px+ tap target) that resets the store.
- Wire store selectors into UI components (`components/ui/*` read from `gameStore`, never touch R3F directly).

**Phase 7 — Juice**
- Camera shake/zoom-punch: small `CameraRig` effect triggered by a store event/flag on collision or knockoff (e.g. a `lastEvent` field in the store consumed once via `useFrame` + timer, or a Rapier collision event callback).
- Drag highlight/trail on the actively-dragged marble (emissive pulse or a simple trailing mesh/line).
- Aim line: dashed line from the marble outward along the drag direction, evenly-spaced dots, growing longer as drag power increases (capped at `MAX_DRAG_PIXELS`). No color ramp — length is the only power cue (decided 2026-08-19).
- Call `playSound('flick' | 'collision' | 'knockoff')` stubs at the right trigger points.

**Phase 8 — Mobile polish & responsive scale-up**
- Test/tune at 375–430px width first: camera FOV/position, UI sizing, touch target sizes, safe-area insets on a device with a notch/home-indicator (simulate via devtools).
- Scale up for desktop: confirm layout doesn't break at wide viewports (table framing may want a max-width container centered, or camera FOV adjustment breakpoint).

## 4. Testing / Validation
- Manual: run `next dev`, test in Chrome devtools mobile emulation (390×844) for full loop — flick, knockoff, scoring, round reset, win screen, play again.
- Manual: verify texture loading works with real files dropped in, and doesn't crash without them.
- Manual: verify `touch-action: none` actually prevents page scroll/zoom during a drag on a real touch device or emulated touch in devtools.
- No automated test framework currently in the repo — out of scope to introduce one unless requested; rely on manual verification per the project's `run` skill for in-browser checks before calling phases done.
- `npm run lint` (eslint via `eslint-config-next`) should stay clean throughout.

## 5. Explicit Non-Goals Reminder
Do not add: backend routes, auth, database, real networked multiplayer, AI opponent, orbit camera controls in the shipped build, real audio files/mixing. Stub points only where the PRD specifies.
