# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

| Piece | Version / notes |
| --- | --- |
| Next.js | 16 (App Router, Turbopack dev) |
| React | 19 |
| TypeScript | 5 (strict) |
| PixiJS | 8 (`pixi.js`) |
| @pixi/react | 8 — root is `<Application>` (not legacy `<Stage>`) |
| Convex | real-time backend; `npx convex dev` for local deployment |
| Tailwind | 4 (`@import "tailwindcss"` in `globals.css`) |
| anime.js | used for entity sway animations |
| @pixi/particle-emitter | installed for later phases |

See `MASTER-PLAN.md` for the full roadmap. Phase plans live in `phases/phase-*.md`.

## Commands

- **Frontend:** `npm run dev` — Next.js on port 3000.
- **Convex backend:** `npx convex dev` — syncs schema/functions; writes `NEXT_PUBLIC_CONVEX_URL` to `.env.local`.
- **Production:** `npm run build && npm start`.
- **Lint:** `npm run lint`.

## Architecture

### Rendering pipeline

```
page.tsx
  └─ IsometricCanvas (manages PendingPlacement state, mounts AdminPanel)
       └─ IsometricGrid (public export — switches on NEXT_PUBLIC_CONVEX_URL)
            ├─ IsometricGridWithConvex  (useWorldData + useMutation)
            └─ IsometricGridView        (pure Pixi scene, no Convex imports)
                 └─ <Application resizeTo={containerRef}>
                      └─ <pixiContainer scale=zoom x=panX y=panY>   ← camera
                           ├─ pixiGraphics (interaction backdrop)
                           ├─ TileLayer    (grass / water / road diamonds)
                           ├─ ShadowLayer  (ellipse drop-shadows, depth-sorted)
                           ├─ EntityLayer  → AnimatedEntity × N
                           └─ pixiGraphics (hover highlight, eventMode="none")
```

**Offline / no-Convex fallback:** `IsometricGrid` renders a static `DEFAULT_WORLD_CONFIG` grid (20×20 grass) when `NEXT_PUBLIC_CONVEX_URL` is absent or Convex is unreachable.

### Key files

| File | Role |
| --- | --- |
| `src/types/world.ts` | Shared types: `WorldData`, `WorldEntity`, `TileGrid`, `WorldConfig`, enums |
| `src/lib/isoMath.ts` | `tileToScreen` / `screenToTile`, `createDefaultIsoConfig`, `getGridWorldCenter` |
| `src/lib/tileColors.ts` | Tile fill colours; re-exports `grassColorForTile` for back-compat |
| `src/lib/footprintMath.ts` | `footprintBounds` — screen-space AABB + anchor for a W×H tile footprint |
| `src/lib/spriteCache.ts` | `loadTextureCached` / `getCachedTexture` — `Assets.load` with in-memory dedupe |
| `src/lib/spriteSheetUtils.ts` | `sliceHorizontalSpriteStrip` — splits a horizontal frame-strip texture |
| `src/hooks/useCamera.ts` | Wheel zoom (`passive: false`), trackpad/drag pan, pinch zoom, `animateZoomTo` |
| `src/hooks/useWorldData.ts` | Convex queries → `WorldData`; handles bootstrap via `convex/seed.ts seedWorld` |
| `src/hooks/useInteractions.ts` | Hover/tap/select state machine; distinguishes mouse vs touch modes |
| `src/components/AnimatedEntity.tsx` | Per-entity Pixi node — placeholder graphics, static sprite, or animated sprite strip; anime.js sway for trees/plants; streetlamp glow |
| `src/components/ShadowLayer.tsx` | Ellipse drop-shadows for buildings + decorations, depth-sorted |
| `src/components/AdminPanel.tsx` | Upload sprite → Convex storage → place entity on grid |

### Convex schema (convex/schema.ts)

- **`world`** — single doc: grid dims, `defaultTile`, `timeOfDay`, `season`, `weather`, seed flags (`phase4DemoSeeded`, `phase6DemoSeeded`, `phase7DemoSeeded`).
- **`entities`** — buildings / decorations / vehicles on the grid. Indexed by `type` and `(gridX, gridY)`. Optional `spriteUrl` (direct https) takes precedence over `assetId`; seasonal variant resolved in queries via `seasonalAssets`.
- **`tiles`** — per-cell overrides indexed by `(x, y)`.
- **`assets`** — uploaded sprite metadata + resolved `url`. Uploads use `generateUploadUrl` + `assets.create` (mutations cannot call `ctx.storage.store()`).

### Entity sprite resolution

`entities.getAll` / `getByType` resolve the final `spriteUrl` server-side: direct `spriteUrl` → seasonal asset → `assetId` → `ctx.storage.getUrl`. The client receives a hydrated `WorldEntity` with `spriteUrl` already set.

### Isometric depth sorting

Depth = `gridX + gridY` (higher = drawn later = visually in front). `ShadowLayer` uses the same key. `AnimatedEntity` footprints use `footprintBounds` to find the bottom-center anchor.

## Rules

1. **No `any`** — use proper types or `unknown`.
2. **Pixi in client components only** — all PixiJS imports must be inside `"use client"` files.
3. **`reactStrictMode` is off** (`next.config.ts`) — Pixi must not double-mount.
4. **Wheel events** — always `addEventListener("wheel", …, { passive: false })` in `useEffect`; never React's `onWheel`.
5. **`extend()`** — register every Pixi display-object type used in JSX (e.g., `extend({ AnimatedSprite, Container, Graphics, Sprite })`).
6. **Docs** — use **Context7** for PixiJS 8, @pixi/react 8, anime.js, Convex. Older training data describes incompatible APIs.

## Environment

- **`NEXT_PUBLIC_CONVEX_URL`** — written by `npx convex dev` into `.env.local`.
