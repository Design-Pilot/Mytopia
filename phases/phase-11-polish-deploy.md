# Phase 11: Polish + Deploy

## Goal

Add loading states, error handling, performance optimizations, and deploy to Vercel. Final cross-browser testing.

## Prerequisites

- All previous phases complete (or at least Phases 1-7 + Phase 10 for a functional MVP)

## Tech Involved

- Next.js 15 (build, deployment)
- Vercel (hosting, environment variables)
- PixiJS 8 (texture management, culling)
- React (Suspense, error boundaries)
- Tailwind CSS (loading UI)

## Detailed Tasks

### 1. Add loading states

**Initial page load:**
- Show a branded loading screen while Convex data loads
- Animated dots/spinner with "Loading GitTown..." text
- Transition: fade out loading screen, fade in canvas

```tsx
if (worldData.isLoading) {
  return <LoadingScreen />;
}
```

**Sprite loading:**
- Track how many sprites are loading vs loaded
- Show a subtle progress indicator if many sprites are pending
- Ensure canvas renders tiles immediately — sprites appear as they load

### 2. Add error boundaries

Wrap the main canvas in a React error boundary:
- If PixiJS crashes, show a friendly error message
- Offer a "Reload" button
- Log error details to console

```tsx
<ErrorBoundary fallback={<ErrorScreen />}>
  <IsometricGrid worldData={worldData} />
</ErrorBoundary>
```

### 3. Handle missing Convex URL

If `NEXT_PUBLIC_CONVEX_URL` is not set:
- Show a helpful setup message (like v1's ConvexClientProvider)
- Don't crash with a cryptic error

### 4. Performance: entity culling

Don't render entities that are off-screen:
- Calculate visible world bounds from camera position + viewport size + zoom
- Filter entities to only those within visible bounds (with some padding)
- Reduces draw calls when zoomed into a small area of a large map

```ts
const visibleEntities = entities.filter(entity => {
  const { screenX, screenY } = tileToScreen(entity.gridX, entity.gridY, ...);
  return (
    screenX > viewLeft - padding &&
    screenX < viewRight + padding &&
    screenY > viewTop - padding &&
    screenY < viewBottom + padding
  );
});
```

### 5. Performance: texture cleanup

When the component unmounts:
- Destroy all PixiJS textures
- Clear the sprite cache
- Prevent memory leaks from orphaned GPU textures

When sprites are no longer used (entity deleted):
- Remove texture from cache
- Call `texture.destroy(true)` to free GPU memory

### 6. Performance: reduce re-renders

Audit React re-renders:
- Use `useMemo` for expensive computations (tile grid building, entity sorting)
- Use `useCallback` for event handlers passed to PixiJS components
- Ensure camera state changes (zoom/pan) don't re-render entity components
- Profile with React DevTools if needed

### 7. Responsive layout

**Desktop**: Full canvas with optional sidebar (admin)
**Tablet**: Same as desktop but smaller
**Mobile**: Full canvas, tooltips positioned to avoid edge overflow

Key responsive fixes:
- Stage resizes on window resize
- Touch targets are large enough on mobile
- Tooltip positioning accounts for small screens
- Admin sidebar collapses to a bottom sheet on mobile (if applicable)

### 8. SEO and metadata

Update `layout.tsx` metadata:
```ts
export const metadata: Metadata = {
  title: "GitTown — Interactive Portfolio",
  description: "An isometric city showcasing projects and experience",
  openGraph: {
    title: "GitTown",
    description: "Explore projects on an isometric city map",
    // Add OG image later
  },
};
```

### 9. Configure Vercel deployment

**`vercel.json`** (if needed):
- No special config typically needed for Next.js on Vercel

**Environment variables on Vercel:**
- `NEXT_PUBLIC_CONVEX_URL` — Convex production deployment URL
- `ADMIN_PASSWORD` — admin password
- `ADMIN_SESSION_SECRET` — session signing secret

**Convex production:**
- Run `npx convex deploy` to deploy schema to production
- Set `ADMIN_PASSWORD` in Convex deployment settings

### 10. Build and test production build

```bash
npm run build
npm run start
```

Verify:
- Build completes without errors
- Production server serves the page correctly
- No hydration mismatches
- Canvas renders correctly in production mode

### 11. Cross-browser testing

Test in:
| Browser | What to Check |
|---------|---------------|
| Chrome | Full functionality (primary target) |
| Safari | Canvas rendering, touch events, wheel behavior |
| Firefox | Canvas rendering, performance |
| Mobile Safari | Touch pan/zoom, tooltips |
| Mobile Chrome | Touch pan/zoom, tooltips |

Known browser quirks to watch:
- Safari: wheel events may behave differently
- Safari: `image-rendering` CSS property differences
- Firefox: performance with many PixiJS filters

### 12. Final cleanup

- Remove all dev controls (weather toggle, time buttons) or put behind a query param (`?dev=1`)
- Remove console.logs
- Ensure no TODO comments left in production code
- Verify all TypeScript types are correct (`npx tsc --noEmit`)

### 13. Deploy

```bash
# Deploy to Vercel
vercel deploy --prod

# Or connect git repo and deploy on push
```

Verify deployed URL:
- Page loads
- Canvas renders
- Data loads from Convex
- Admin login works
- No console errors

## Testing Steps (Chrome DevTools)

| # | What to Test | How to Verify |
|---|-------------|---------------|
| 1 | Loading screen | Shows branded loading on first visit |
| 2 | Loading transition | Smooth fade from loading to canvas |
| 3 | Error boundary | Force an error → friendly error screen shows |
| 4 | Missing Convex URL | Remove env var → helpful setup message |
| 5 | Sprite loading | Tiles render immediately; sprites appear as they load |
| 6 | Entity culling | Zoom into corner → check render count (fewer draws) |
| 7 | Memory | Navigate away and back → no memory leak (Performance tab) |
| 8 | Production build | `npm run build` → 0 errors |
| 9 | Production server | `npm start` → page works correctly |
| 10 | Chrome desktop | Full test pass |
| 11 | Safari desktop | Canvas renders, zoom/pan work |
| 12 | Firefox desktop | Canvas renders, performance acceptable |
| 13 | Mobile touch | Pan and zoom via touch gestures |
| 14 | Mobile tooltips | Tap building → tooltip visible, not clipped |
| 15 | Deployed URL | Production URL loads and works |
| 16 | Admin on production | Login → place entity → visible on public page |
| 17 | No console errors | Clean console on production |
| 18 | Dev tools removed | No weather/time toggle buttons on production |

## Checklist

- [ ] Loading screen component created
- [ ] Loading → canvas transition smooth
- [ ] Error boundary wraps canvas
- [ ] Missing Convex URL handled gracefully
- [ ] Sprite loading doesn't block tile rendering
- [ ] Entity culling implemented (off-screen entities skipped)
- [ ] Texture cleanup on unmount
- [ ] React re-render audit (useMemo, useCallback)
- [ ] Stage resizes on window resize
- [ ] Touch targets adequate on mobile
- [ ] Tooltip positioning works on small screens
- [ ] SEO metadata set
- [ ] Vercel environment variables configured
- [ ] Convex production deployment done
- [ ] `npm run build` succeeds
- [ ] `npm start` serves correctly
- [ ] Chrome tested and passing
- [ ] Safari tested and passing
- [ ] Firefox tested and passing
- [ ] Mobile Chrome tested
- [ ] Mobile Safari tested
- [ ] Dev controls removed or hidden behind flag
- [ ] Console.logs removed
- [ ] TypeScript clean (`npx tsc --noEmit`)
- [ ] Deployed to Vercel
- [ ] Production URL works end-to-end
- [ ] Admin works on production

## Acceptance Criteria

1. Page loads with a branded loading screen that transitions smoothly to the canvas
2. Errors are caught by error boundaries (no white screen crashes)
3. Performance is smooth: 60fps with 10+ entities, no memory leaks
4. Production build completes without errors
5. Deployed Vercel URL works: public viewer loads, admin login works, entity placement works
6. Works on Chrome, Safari, and Firefox (desktop); touch works on mobile

## Files to Create / Modify

| Action | File |
|--------|------|
| Create | `src/components/LoadingScreen.tsx` |
| Create | `src/components/ErrorBoundary.tsx` |
| Create | `vercel.json` (if needed) |
| Modify | `src/app/page.tsx` (add loading/error handling) |
| Modify | `src/app/layout.tsx` (SEO metadata) |
| Modify | `src/components/IsometricGrid.tsx` (entity culling) |
| Modify | `src/components/EntityLayer.tsx` (texture cleanup) |
| Modify | `src/lib/spriteCache.ts` (cleanup methods) |
| Modify | `src/components/DevWeatherControls.tsx` (hide behind flag) |

## Blockers / Notes

_Updated during development._
