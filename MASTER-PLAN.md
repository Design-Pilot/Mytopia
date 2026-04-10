# MyTopia v2 — Master Plan

> Isometric pixel-art portfolio city rebuilt from scratch with PixiJS + React.

---

## Project Overview

MyTopia is an isometric portfolio map where projects, companies, and entities are rendered as buildings on a tile-based island. Visitors pan, zoom, hover, and click buildings to explore. The owner uses an admin editor to place buildings, upload sprites, and customize the world.

**Why rebuild?** The original used Phaser 3 as a game engine inside React, causing constant friction: React-Phaser bridge bugs, canvas pixelation, camera issues. The new version uses PixiJS 8 with @pixi/react for declarative canvas rendering that works *with* React instead of fighting it.

---

## Tech Stack


| Layer     | Technology                         | Purpose                                        |
| --------- | ---------------------------------- | ---------------------------------------------- |
| Framework | Next.js 15 + React 19 + TypeScript | App shell, routing, SSR for non-canvas pages   |
| Rendering | PixiJS 8 + @pixi/react             | Declarative canvas rendering, sprites, filters |
| Animation | anime.js                           | Path movement (cars), tweening (sway, shimmer) |
| Particles | @pixi/particle-emitter             | Weather effects (clouds, rain, leaves, snow)   |
| Backend   | Convex                             | Real-time database, file storage, mutations    |
| Styling   | Tailwind CSS 4                     | Admin UI, tooltips, panels, loading states     |
| Hosting   | Vercel                             | Deployment, edge functions, CDN                |


### Why Each Choice

- **PixiJS 8 + @pixi/react** — Renders sprites on canvas but exposes them as React components. No event bus bridges. Data flows through props. Solves every problem the old Phaser setup had.
- **anime.js** — Lightweight tweening library for moving cars along paths, swaying trees, shimmer effects. Works on any JS values, not tied to DOM or canvas.
- **@pixi/particle-emitter** — Purpose-built particle system for PixiJS. Handles hundreds of rain drops or falling leaves efficiently on the GPU.
- **Convex** — Real-time reactive queries mean the viewer updates instantly when admin makes changes. File storage handles sprite uploads. Proven in the current project.

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   Next.js App                    │
│                                                  │
│  ┌──────────────┐        ┌───────────────────┐  │
│  │  Public Page  │        │   Admin Editor     │  │
│  │  (viewer)     │        │   (Phase 10)       │  │
│  └──────┬───────┘        └────────┬──────────┘  │
│         │                         │              │
│         ▼                         ▼              │
│  ┌──────────────────────────────────────────┐   │
│  │         useWorldData() hook               │   │
│  │   Convex queries → assembled WorldData    │   │
│  └──────────────────┬───────────────────────┘   │
│                     │                            │
│                     ▼                            │
│  ┌──────────────────────────────────────────┐   │
│  │        @pixi/react <Stage>                │   │
│  │                                           │   │
│  │   <TileLayer />      tiles as Graphics    │   │
│  │   <ShadowLayer />    shadow sprites       │   │
│  │   <EntityLayer />    buildings, decor     │   │
│  │   <AmbientLayer />   cars, sway, shimmer  │   │
│  │   <WeatherLayer />   clouds, particles    │   │
│  │   <FilterLayer />    day/night, seasons   │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │   React UI (Tailwind)                     │   │
│  │   Tooltips, panels, loading states        │   │
│  └──────────────────────────────────────────┘   │
└──────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────┐
│     Convex        │
│  world, entities, │
│  tiles, assets    │
└──────────────────┘
```

### Data Flow

1. **Convex → React**: `useWorldData()` hook fires queries and assembles a `WorldData` object
2. **React → PixiJS**: Data passes as props to @pixi/react components — no registry, no event bus
3. **PixiJS → React**: Interaction events (hover, click) bubble up via callback props
4. **Admin → Convex**: Mutations save changes; reactive queries auto-update all viewers

---

## Rendering Layer Architecture


| Z-Order | Layer        | Contents                                     |
| ------- | ------------ | -------------------------------------------- |
| 0       | TileLayer    | Isometric grid diamonds (grass, water, road) |
| 1       | ShadowLayer  | Static shadow sprites under buildings        |
| 2       | EntityLayer  | Buildings + decorations, Y-sorted for depth  |
| 3       | AmbientLayer | Moving cars, sway animations, water shimmer  |
| 4       | WeatherLayer | Clouds, cloud shadows, rain/leaf particles   |
| 5       | FilterLayer  | Day/night color grading, seasonal tint       |


---

## Convex Schema (Redesigned)

```
world          — single doc: grid size, default tile, active theme/season/time
entities       — unified table: buildings, decorations, vehicles (type field)
tiles          — sparse overrides (only non-default tiles stored)
assets         — uploaded sprites with metadata (type, tags, frames)
```

Key changes from v1:

- **Unified `entities` table** instead of separate buildings/decorations — simpler queries, one renderer
- `**assets` table** for sprite management — decoupled from entity placement
- `**world` table** holds theme state (time of day, season, weather) — single source of truth

---

## Phase Overview


| #   | Phase                    | Key Deliverable                                      | Depends On |
| --- | ------------------------ | ---------------------------------------------------- | ---------- |
| 1   | Project Setup ✅         | New repo builds and runs with empty PixiJS canvas    | —          |
| 2   | Isometric Grid + Camera ✅ | 10x10 tile grid visible, zoom/pan works              | 1          |
| 3   | Convex Data Layer        | Schema, queries, seed data, useWorldData hook        | 1          |
| 4   | Tiles + Buildings        | Tile types render, building sprites load from Convex | 2, 3       |
| 5   | Interactions             | Hover tooltips, click select, touch support          | 4          |
| 6   | Decorations + Animations | Decoration sprites, sprite sheet animation system    | 4          |
| 7   | Shadows + Ambient        | Static shadows, tree sway, cars moving on roads      | 5, 6       |
| 8   | Weather & Atmosphere     | Cloud sprites drifting, cloud shadows                | 7          |
| 9   | Day/Night + Seasons      | Color grading, time presets, seasonal asset swap     | 7          |
| 10  | Admin Editor             | Auth, place/move/delete entities, asset upload       | 5          |
| 11  | Polish + Deploy          | Loading states, performance, Vercel deployment       | All        |


### Phase Dependency Graph

```
Phase 1 ──→ Phase 2 ──┐
       └──→ Phase 3 ──┤
                       ▼
                  Phase 4 ──→ Phase 5 ──→ Phase 7 ──→ Phase 8
                         └──→ Phase 6 ──┘       └──→ Phase 9
                              Phase 5 ──────────────→ Phase 10
                                                       ▼
                                                  Phase 11
```

Phases 2 and 3 can run in parallel. Phases 8, 9, and 10 can run in parallel after their prerequisites.

---

## Key Decisions


| Decision   | Choice                    | Rationale                                             |
| ---------- | ------------------------- | ----------------------------------------------------- |
| Shadows    | Static sprites (Option A) | Reliable for vibe coding; upgrade to dynamic later    |
| Particles  | Light density first       | Clouds only initially; add rain/snow/leaves later     |
| Auth       | Deferred to Phase 10      | Viewer-first MVP doesn't need auth                    |
| Editor     | Place + move + delete     | No terrain painting initially; simplest useful editor |
| Terrain    | Grass + water + road      | 3 types to start; add more as needed                  |
| Map size   | Small (5-10 buildings)    | Quick to build and test; expand later                 |
| Art source | AI-generated sprites      | Uploaded through admin editor                         |


---

## Vibe Coding Guidelines

Since this project is built entirely by Claude Code:

1. **Use context7** for every PixiJS, @pixi/react, and anime.js task to get current docs
2. **Build incrementally** — one component at a time, verify with Chrome DevTools before moving on
3. **CLAUDE.md is critical** — keep it updated as patterns are established
4. **Test visually** — use Chrome DevTools MCP to screenshot and verify rendering
5. **Simple over clever** — straightforward code is easier for future Claude instances to maintain
6. **Wheel listeners need `{ passive: false }`** — learned from the current project

---

## Files Reference

Each phase has a dedicated plan document in `New Plan/phases/`:

- [Phase 01 — Project Setup](phases/phase-01-project-setup.md)
- [Phase 02 — Isometric Grid + Camera](phases/phase-02-isometric-grid-camera.md)
- [Phase 03 — Convex Data Layer](phases/phase-03-convex-data-layer.md)
- [Phase 04 — Tiles + Buildings](phases/phase-04-tiles-buildings.md)
- [Phase 05 — Interactions](phases/phase-05-interactions.md)
- [Phase 06 — Decorations + Animations](phases/phase-06-decorations-animations.md)
- [Phase 07 — Shadows + Ambient](phases/phase-07-shadows-ambient.md)
- [Phase 08 — Weather + Atmosphere](phases/phase-08-weather-atmosphere.md)
- [Phase 09 — Day/Night + Seasons](phases/phase-09-day-night-seasons.md)
- [Phase 10 — Admin Editor](phases/phase-10-admin-editor.md)
- [Phase 11 — Polish + Deploy](phases/phase-11-polish-deploy.md)

