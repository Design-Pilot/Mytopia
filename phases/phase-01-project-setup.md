# Phase 1: Project Setup

## Goal

Create a new Next.js 15 project from scratch with all dependencies installed, configured, and a blank PixiJS canvas rendering on screen.

## Prerequisites

None — this is the first phase.

## Tech Involved

- Next.js 15 (App Router, Turbopack)
- React 19
- TypeScript 5
- PixiJS 8 + @pixi/react
- Convex
- Tailwind CSS 4
- anime.js (install now, use later)
- @pixi/particle-emitter (install now, use later)

## Detailed Tasks

### 1. Create the project

```bash
npx create-next-app@latest gittown-v2 --typescript --tailwind --eslint --app --src-dir
```

Choose: App Router, src/ directory, TypeScript, Tailwind, ESLint.

### 2. Install dependencies

```bash
cd gittown-v2
npm install pixi.js @pixi/react convex animejs @pixi/particle-emitter
npm install -D @types/node
```

### 3. Configure Next.js

Edit `next.config.ts`:

- Set `reactStrictMode: false` — PixiJS can have issues with strict mode double-mounting
- Ensure Turbopack is default for dev

### 4. Configure Convex

```bash
npx convex dev
```

This creates `convex/` directory, `.env.local` with `NEXT_PUBLIC_CONVEX_URL`, and generated files.

### 5. Set up Tailwind CSS 4

Verify Tailwind 4 is working with the PostCSS plugin (`@tailwindcss/postcss`). Confirm `globals.css` has the right imports.

### 6. Create project structure

```
src/
  app/
    layout.tsx          — Root layout with ConvexClientProvider
    page.tsx            — Public viewer page (placeholder for now)
    globals.css         — Tailwind + global styles
  components/
    ConvexClientProvider.tsx  — Convex React provider
    IsometricCanvas.tsx      — Main PixiJS canvas wrapper (placeholder)
  lib/
    isoMath.ts          — tileToScreen, screenToTile (port from old project)
  hooks/
    useWorldData.ts     — Data hook placeholder
```

### 7. Create CLAUDE.md

Write the project CLAUDE.md with:

- Tech stack and versions
- Dev commands (`npm run dev`, `npx convex dev`)
- Architecture overview
- Critical rules (no `any`, passive wheel listeners, `"use client"` for PixiJS, context7 for docs)
- Environment variables

### 8. Create ConvexClientProvider

Simple provider wrapping children with `ConvexProvider`. Handle missing env var gracefully.

### 9. Create placeholder IsometricCanvas

A `"use client"` component that renders a @pixi/react `<Stage>` with a solid background color. Confirm PixiJS mounts and renders.

### 10. Create root layout

Wire up ConvexClientProvider and import globals.css. Set metadata (title, description).

### 11. Create homepage

Import IsometricCanvas and render it full-screen. Verify the page loads with a colored canvas.

### 12. Port isoMath.ts

Copy `tileToScreen()` and `screenToTile()` from the old project. These are pure math with no dependencies. Add TypeScript types.

## Testing Steps (Chrome DevTools)


| #   | What to Test            | How to Verify                                                         |
| --- | ----------------------- | --------------------------------------------------------------------- |
| 1   | Dev server starts       | `npm run dev` runs without errors                                     |
| 2   | Page loads              | Navigate to localhost:3000, page renders                              |
| 3   | No console errors       | Chrome DevTools → Console tab is clean                                |
| 4   | PixiJS canvas mounts    | Chrome DevTools → Elements tab shows `<canvas>` inside the page       |
| 5   | Canvas has correct size | Canvas fills viewport (check computed width/height)                   |
| 6   | Convex connects         | No Convex connection errors in console (or graceful "no URL" message) |
| 7   | Tailwind works          | Add a Tailwind class to a test element, verify it renders styled      |


## Checklist

- New Next.js project created
- All dependencies installed (pixi.js, @pixi/react, convex, animejs, @pixi/particle-emitter)
- next.config.ts configured (reactStrictMode: false)
- Convex initialized (`npx convex dev` creates convex/ dir)
- Tailwind CSS 4 working
- Project folder structure created
- CLAUDE.md written for the new project
- ConvexClientProvider component created
- IsometricCanvas placeholder renders PixiJS (`<Application>` from @pixi/react v8)
- Root layout wires up provider
- Homepage renders canvas full-screen
- isoMath.ts ported (tileToScreen, screenToTile)
- Dev server runs cleanly
- Browser console: no app errors (only dev/HMR noise)
- Canvas visible (green viewport)

## Acceptance Criteria

1. Running `npm run dev` starts the dev server without errors
2. Navigating to `localhost:3000` shows a full-screen colored canvas
3. Chrome DevTools Console has zero errors
4. Chrome DevTools Elements tab shows a `<canvas>` element
5. The project has a complete CLAUDE.md
6. `isoMath.ts` exports `tileToScreen` and `screenToTile` functions

## Files to Create / Modify


| Action | File                                               |
| ------ | -------------------------------------------------- |
| Create | `src/app/layout.tsx`                               |
| Create | `src/app/page.tsx`                                 |
| Create | `src/app/globals.css`                              |
| Create | `src/components/ConvexClientProvider.tsx`          |
| Create | `src/components/IsometricCanvas.tsx`               |
| Create | `src/lib/isoMath.ts`                               |
| Create | `src/hooks/useWorldData.ts` (placeholder)          |
| Create | `CLAUDE.md`                                        |
| Modify | `next.config.ts`                                   |
| Modify | `package.json` (dependencies added by npm install) |


## Blockers / Notes

- Scaffold used **Next.js 16** (current `create-next-app` default); master plan mentions 15 — behavior is the same for our usage (App Router, Turbopack).
- **npm package name:** folder `Mytopia` cannot be the npm `name` (no capitals); `package.json` uses `mytopia`.
- **@pixi/react v8** uses `<Application>` + `extend()` for custom nodes; the old `<Stage>` name is gone. Phase 2 docs should say `Application` where they say `Stage`.
- **Convex:** `npx convex dev --once` configured a local anonymous deployment and wrote `.env.local`.
- **Dev server port:** if 3000 is busy, Next picks another port (e.g. 3002); check the terminal line `Local: http://localhost:…`.

