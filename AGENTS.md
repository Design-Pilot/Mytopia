# MyTopia — AI / contributor notes

## Stack (Phase 1 baseline)

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

- **Public viewer:** `src/app/page.tsx` → `IsometricCanvas` (Pixi `@pixi/react` `<Application>`).
- **Data (later):** `useWorldData()` in `src/hooks/useWorldData.ts` will assemble Convex-backed `WorldData`.
- **Isometric math:** `src/lib/isoMath.ts` — `tileToScreen` / `screenToTile` for 2:1 diamond tiles.

## Rules that matter

1. **No `any`** — use proper types or `unknown`.
2. **Pixi / canvas in React** — only in client components (`"use client"`). Do not import Pixi in server components.
3. **`reactStrictMode` is off** in `next.config.ts` so Pixi does not double-mount awkwardly.
4. **Wheel / zoom (when added):** use `addEventListener("wheel", handler, { passive: false })` in `useEffect`, not React’s `onWheel` (passive).
5. **Docs:** use **Context7** for PixiJS 8, @pixi/react, anime.js, Convex — APIs differ from older training data.

## Environment

- **`NEXT_PUBLIC_CONVEX_URL`** — set by Convex CLI in `.env.local` (see Convex dashboard when using `npx convex dev`).

## Pointers

- Phase plans: `phases/phase-*.md`
- Convex generated types: `convex/_generated/` (do not hand-edit)

@AGENTS.md
