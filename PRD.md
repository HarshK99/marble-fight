# Marble Fight — PRD

## Summary
Single-player-device MVP of a physics-based "flick and knock off the table" marble game. Two marbles, one table, one phone passed between two players. Flick your marble into the opponent's to knock it off the edge and win the round. Best-of-5 match.

## Goals
- Ship a mobile-first, touch-controlled 3D physics game that feels tactile and "already looks intentional" — no placeholder visuals.
- Realistic marble-and-asphalt look (glassy marbles, PBR asphalt road) using R3F + Rapier physics.
- Clean local two-player pass-and-play loop with score tracking and a win screen.
- Code structured so AI opponent or online multiplayer can be added later without a rewrite.

## Non-Goals (explicitly out of scope for this MVP)
- No backend, no auth, no persistence beyond in-memory session state.
- No AI opponent.
- No online/networked multiplayer.
- No orbit/free camera — camera is fixed, angled top-down.
- No real audio assets — only stubbed sound hooks.

## Target Platform
- Mobile web, portrait, ~375–430px viewport, designed and tested mobile-first.
- Desktop is a scaled-up enhancement of the same layout, not a separate design.
- Touch is the primary input; mouse drag should work equivalently for desktop testing.

## Users & Core Loop
Two people share one phone. Player 1 flicks their marble (touch drag → release), physics resolves, turn passes to Player 2, repeat. A marble that falls off the table's edge or below its Y-bound is "knocked off" — the round ends, the other player scores a point. First to majority of a configurable best-of-N (default 5) wins the match; a win screen appears with an option to start a new match.

## Functional Requirements

### Scene & Visuals
- Fixed angled top-down camera framing the full table with minimal letterboxing on a narrow mobile viewport.
- Marbles: sphere geometry, `MeshPhysicalMaterial` (low roughness, high clearcoat, slight transmission for glassy look), color-differentiated per player (e.g. blue vs red).
- Road: plane textured with Poly Haven "Asphalt 04" 2K set (`asphalt_04_diff_2k.jpg`, `asphalt_04_nor_gl_2k.jpg`, `asphalt_04_rough_2k.jpg`) loaded via `useTexture` from `/public/textures/road/`, tiled via `repeat`/`wrapS`/`wrapT` (no stretching).
- Lighting: `<Environment preset="city">` for reflections/ambient, one shadow-casting directional light, drei `<ContactShadows>` under marbles for grounding.

### Controls & Physics
- Each marble is a Rapier rigid body with a ball collider.
- Flick gesture: track pointer/touch down → up position in screen space, compute 2D delta, normalize + scale (capped at a max drag distance) into an impulse applied directly on X/Z at release — no camera unprojection.
- Impulse magnitude capped so flicks stay controllable.
- Marble physics tuned for a marble feel specifically: low friction, higher restitution (bouncy, rolls freely) — distinct from default Rapier defaults.
- Only the current player's marble is draggable; input is locked out between release and turn resolution (marbles settled/at rest) and during the opponent's turn.

### Game State & Rules
- Turn alternation after each flick fully resolves (marbles at rest, or one has been knocked off).
- Off-table detection: marble Y below table plane threshold, or XZ outside table bounds → "knocked off."
- Round end → score increment for the non-knocked-off player → board reset → next round, alternating who flicks first (TBD default: loser of round flicks first, or alternate strictly — decide in plan/implementation).
- Match end at first-to-majority of best-of-N (default N=5, configurable constant/prop).
- Win screen: shows match winner, final score, "Play Again" action that resets full match state.

### UI/UX
- Mobile-first layout; large touch targets (min 44px) for any buttons.
- Score panel and controls respect safe-area insets (`env(safe-area-inset-*)`).
- `touch-action: none` on the canvas to prevent scroll/zoom during drags.
- Visual feedback: highlight/trail on the marble currently being dragged, subtle camera shake or zoom-punch on collision/knockoff events.
- Sound hook stubs (e.g. `playSound('collision')`, `playSound('knockoff')`, `playSound('flick')`) called at the right moments, no-op or console-log implementation for now.

## Architecture Requirements
- Clear separation between the R3F/Rapier scene+physics layer and the UI/game-state layer, connected via Zustand (or equivalent context/reducer) — not tangled together — so AI/multiplayer can hook into game state later.
- 3D scene component(s) marked `"use client"`.
- Road material setup has a comment block documenting the exact expected texture paths.

## Success Criteria
- Playable end-to-end on a real mobile browser (portrait, ~390px width): flick works via touch, physics feels controlled, knockoff/scoring/turns/win screen all function correctly.
- Visuals look intentional on first run assuming the three texture files are present (i.e., if textures are placeholders/missing it should still degrade gracefully, not crash).
- No backend/auth/multiplayer code introduced.
- Game-state logic is testable/reasoned-about independent of the R3F render tree.

## Open Questions (to resolve before/at implementation start)
1. Who flicks first each round — the player who lost the previous round, or strict alternation?
2. Table dimensions/aspect ratio — fixed values needed for camera framing and off-table bounds checks.
3. Do we need a "reset if both marbles come to rest with neither off the table" (stalemate) fallback, or is that impossible by table geometry?
