# MyTopia — AI / contributor notes

## Stack (through Phase 4 viewer)

| Piece | Version / notes |
| --- | --- |
| Next.js | 16 (App Router, Turbopack dev) |
| React | 19 |
| TypeScript | 5 (strict) |
| PixiJS | 8 (`pixi.js`) |
| @pixi/react | 8 — root is `<Application>` (not legacy `<Stage>`) |
| Convex | real-time backend; `npx convex dev` for local deployment |
| Tailwind | 4 (`@import "tailwindcss"` in `globals.css`) |
| anime.js | installed for later phases |
| @pixi/particle-emitter | installed for later phases |

See `MASTER-PLAN.md` for the full roadmap.

## Commands

- **Frontend:** `npm run dev` — Next.js (default port 3000 if free).
- **Convex:** `npx convex dev` — syncs functions, local URL in `.env.local` as `NEXT_PUBLIC_CONVEX_URL`.
- **Production build:** `npm run build` then `npm start`.
- **Lint:** `npm run lint`.

## Architecture (short)

- **Public viewer:** `src/app/page.tsx` → `IsometricCanvas` → `IsometricGrid` (Pixi `<Application>` + world `<pixiContainer>` camera).
- **Layers:** `TileLayer` (grass / water / road graphics), `EntityLayer` (buildings / decorations — `Sprite` + placeholders, texture cache, footprint anchoring). Register extra Pixi types with `extend()` where needed (`EntityLayer` adds `Sprite`).
- **Camera:** `src/hooks/useCamera.ts` — wheel zoom (passive: false), trackpad pan, drag pan, pinch zoom, tile hover.
- **Data:** `useWorldData()` in `src/hooks/useWorldData.ts` — Convex queries → `WorldData` (`world`, `tileGrid`, `entities`, `assets`, `isLoading`, `bootstrapFailed`). `IsometricGrid` calls it when `NEXT_PUBLIC_CONVEX_URL` is set; otherwise a static fallback grid.
- **Bootstrap:** `convex/seed.ts` `seedWorld` creates the world doc if missing and runs idempotent Phase 4 demo content once (`world.phase4DemoSeeded`). Client attempts bootstrap only when the world doc is missing, while `bootstrapRequestedRef` prevents duplicate in-flight requests and errors reset the guard for a later retry.
- **Isometric math:** `src/lib/isoMath.ts` — `tileToScreen` / `screenToTile`, `createDefaultIsoConfig()`, `getGridWorldCenter()`. Tile fill colors live in `src/lib/tileColors.ts` (also re-exported `grassColorForTile` from `isoMath` for compatibility).
- **Sprites:** `src/lib/spriteCache.ts` — `Assets.load` + in-memory dedupe for entity `spriteUrl`s.
- **Entities:** Convex `entities` may use `assetId` (file storage URL resolved in queries) or optional `spriteUrl` (direct URL; takes precedence). Mutations cannot `ctx.storage.store()` — uploads use `generateUploadUrl` + `assets.create` (see Convex file-storage docs).

## Rules that matter

1. **No `any`** — use proper types or `unknown`.
2. **Pixi / canvas in React** — only in client components (`"use client"`). Do not import Pixi in server components.
3. **`reactStrictMode` is off** in `next.config.ts` so Pixi does not double-mount awkwardly.
4. **Wheel / zoom:** `useCamera` uses `addEventListener("wheel", …, { passive: false })` in `useEffect`, not React’s `onWheel` (passive).
5. **Docs:** use **Context7** for PixiJS 8, @pixi/react, anime.js, Convex — APIs differ from older training data.

## Environment

- **`NEXT_PUBLIC_CONVEX_URL`** — set by Convex CLI in `.env.local` (see Convex dashboard when using `npx convex dev`).

## Pointers

- Phase plans: `phases/phase-*.md`
- Shared viewer types: `src/types/world.ts` (`WorldData`, `TileGrid`, etc.)
- Convex generated types: `convex/_generated/` (do not hand-edit)

@AGENTS.md
