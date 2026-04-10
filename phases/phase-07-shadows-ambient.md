# Phase 7: Shadows + Ambient Animations

## Goal

Add static shadows under buildings, ambient animations (tree sway, water shimmer), and cars moving along road paths.

## Prerequisites

- Phase 5 complete (interactions work)
- Phase 6 complete (decorations and sprite animations work)

## Tech Involved

- PixiJS 8 (Sprite, Container, Graphics, tint, alpha)
- @pixi/react
- anime.js (tweening for sway, shimmer, car movement)
- `isoMath.ts` (path calculation along road tiles)

## Detailed Tasks

### 1. Research anime.js v4 API

Use context7 to fetch anime.js v4 docs. Understand:
- `animate()` function signature
- `createTimeline()` for sequenced animations
- How to animate arbitrary JS objects (not just DOM elements)
- `stagger()` utility

### 2. Create ShadowLayer component

A PixiJS Container that sits between TileLayer (z=0) and EntityLayer (z=2):

For each building/decoration entity:
- Create a shadow sprite: a darkened, semi-transparent copy
- **Simple approach**: draw a dark ellipse at the entity's base
  - Use `Graphics` to draw a filled ellipse
  - Color: black, alpha: 0.2
  - Width: proportional to entity footprint
  - Height: ~40% of width (isometric perspective)
- **Better approach**: use the entity's sprite as shadow
  - Clone the sprite, apply black tint, reduce alpha to 0.15-0.25
  - Skew/offset to simulate light direction
  - More realistic but heavier

**Start with the simple ellipse approach.** Upgrade later if needed.

Shadow position:
- Centered under the entity, offset slightly to simulate sun angle
- Default offset: `(+8px, +4px)` to the right and down (sun from top-left)
- This offset will be configurable for time-of-day changes in Phase 9

### 3. Implement tree/bush sway animation

For decoration entities with `decorType` matching tree/bush/plant patterns:

Use anime.js to animate the PixiJS container's rotation:
```js
// Animate the pixi container's rotation property
anime({
  targets: treeContainer,
  rotation: [degreesToRadians(-2), degreesToRadians(2)],
  duration: 2500,
  easing: 'easeInOutSine',
  loop: true,
  alternate: true,
  delay: anime.stagger(200) // offset each tree
});
```

**Key challenge**: anime.js animates JS objects, and @pixi/react manages PixiJS objects through React. We need to either:
- Use `useRef` to get the PixiJS container reference, then animate it directly with anime.js
- Or use a PixiJS ticker-based approach instead of anime.js

**Recommended**: Use `useRef` + anime.js for ambient animations. This avoids React re-renders for every frame.

### 4. Implement water tile shimmer

For tiles with `tileType === "water"`:
- Cycle the alpha between 0.85 and 1.0
- Stagger the cycle across tiles so they shimmer in waves
- Use anime.js or a PixiJS ticker with sine wave

Simple approach with PixiJS ticker:
```ts
// In a useEffect or useTick callback
waterTile.alpha = 0.85 + Math.sin(time * 0.003 + tileIndex * 0.5) * 0.15;
```

### 5. Implement car movement system

Cars are entities with `type: "vehicle"` in the entities table.

**Step 1: Define road paths**
- Scan the tile grid for road tiles
- Build connected road paths (sequences of adjacent road tile positions)
- Convert tile positions to screen positions using `tileToScreen()`

**Step 2: Create car sprites**
- Load car sprite from entity's asset
- Place on the AmbientLayer (z=3, above entities)

**Step 3: Animate along path**
Using anime.js timeline:
```js
const waypoints = roadPath.map(tile => tileToScreen(tile.x, tile.y, ...));

const tl = anime.createTimeline({
  loop: true,
  defaults: { easing: 'linear' }
});

for (let i = 0; i < waypoints.length - 1; i++) {
  tl.add(carSprite, {
    x: waypoints[i + 1].screenX + tileW / 2,
    y: waypoints[i + 1].screenY + tileH / 2,
    duration: segmentDuration,
  });
}
```

**Step 4: Car direction**
- Flip the car sprite horizontally when moving left vs right
- Based on the direction between consecutive waypoints

**Step 5: Multiple cars**
- Support multiple car entities on different or same paths
- Stagger start times so they don't all move in sync

### 6. Create AmbientLayer component

Container for all ambient animations (z=3):
- Car sprites and their movement
- Any other ambient effects

This layer sits above EntityLayer in the z-order.

### 7. Handle animation cleanup

When component unmounts or data changes:
- Remove all anime.js animations (call `.remove()` on animations)
- Stop PixiJS ticker callbacks
- Prevent memory leaks from orphaned animations

Use `useEffect` cleanup functions for this.

### 8. Add road path calculation utility

**`src/lib/roadPaths.ts`:**
- `findRoadPaths(tileGrid)` — scans grid for connected road tiles
- Returns arrays of waypoints in screen coordinates
- Simple flood-fill or connected-component algorithm

## Testing Steps (Chrome DevTools)

| # | What to Test | How to Verify |
|---|-------------|---------------|
| 1 | Shadows visible | Dark ellipses appear under buildings |
| 2 | Shadow layer order | Shadows render below buildings but above tiles |
| 3 | Shadow offset | Shadows offset slightly to the right/down |
| 4 | Tree sway | Tree decorations gently rock back and forth |
| 5 | Sway stagger | Trees don't all sway in perfect sync |
| 6 | Water shimmer | Water tiles pulse in alpha (visible brightness change) |
| 7 | Shimmer wave | Shimmer ripples across water tiles, not all at once |
| 8 | Car moves | Car sprite moves along road tiles |
| 9 | Car loops | Car returns to start and loops continuously |
| 10 | Car direction | Car sprite flips when changing direction |
| 11 | Multiple cars | Multiple cars move independently |
| 12 | Animation cleanup | Navigate away and back — no duplicate animations |
| 13 | Performance | Animations run at 60fps (check Performance tab) |
| 14 | Console clean | No errors in Chrome DevTools |

## Checklist

- [ ] Context7 docs fetched for anime.js v4
- [ ] ShadowLayer component created
- [ ] Shadow ellipses render under buildings
- [ ] Shadows on correct z-layer (between tiles and entities)
- [ ] Shadow offset configurable
- [ ] Tree sway animation working (anime.js + useRef)
- [ ] Sway staggered across trees
- [ ] Water tile shimmer working
- [ ] Shimmer has wave pattern across tiles
- [ ] Road path calculation utility created
- [ ] Car sprites load and position on road
- [ ] Car moves along road path with anime.js timeline
- [ ] Car loops continuously
- [ ] Car sprite flips based on direction
- [ ] Multiple cars supported with staggered timing
- [ ] AmbientLayer component created (z=3)
- [ ] Animation cleanup on unmount
- [ ] No memory leaks
- [ ] 60fps performance maintained
- [ ] No console errors

## Acceptance Criteria

1. Dark shadow ellipses are visible under every building, layered correctly
2. Tree decorations gently sway with staggered timing
3. Water tiles shimmer with a wave-like pattern
4. At least one car moves along a road path and loops continuously
5. Animations clean up properly on component unmount (no duplicates on re-mount)

## Files to Create / Modify

| Action | File |
|--------|------|
| Create | `src/components/ShadowLayer.tsx` |
| Create | `src/components/AmbientLayer.tsx` |
| Create | `src/lib/roadPaths.ts` (road path finding) |
| Create | `src/hooks/useAmbientAnimations.ts` (anime.js lifecycle) |
| Modify | `src/components/IsometricGrid.tsx` (add shadow + ambient layers) |
| Modify | `convex/seed.ts` (add vehicle entity, road tiles for path) |

## Blockers / Notes

_Updated during development._

**Key risk**: anime.js animates JS objects directly, but @pixi/react manages PixiJS objects through React. Need to use `useRef` to get direct references to PixiJS containers and animate those, bypassing React's render cycle for smooth 60fps animation.
