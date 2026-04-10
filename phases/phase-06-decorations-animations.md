# Phase 6: Decorations + Sprite Animations

## Goal

Render decoration entities (streetlamps, benches, bushes, ponds) and implement a sprite sheet animation system for multi-frame sprites.

## Prerequisites

- Phase 4 complete (entity rendering, depth sorting)

## Tech Involved

- PixiJS 8 (AnimatedSprite, Spritesheet, Texture)
- @pixi/react (AnimatedSprite component or custom)
- Convex (entity type: "decoration", asset metadata)

## Detailed Tasks

### 1. Research PixiJS AnimatedSprite API

Use context7 to fetch PixiJS 8 docs for:
- `AnimatedSprite` — how to create from texture array
- `Spritesheet` — parsing sprite sheet JSON
- `Texture` — creating sub-textures from a single image

### 2. Render decoration entities

Decorations are entities with `type: "decoration"` in the unified entities table. They render the same way as buildings but:
- Typically smaller sprites
- Same depth sorting rules (Y-based)
- Same anchoring (bottom-center)
- No tooltip on hover (or simpler tooltip — just the name)

Update EntityLayer to render both buildings and decorations from the same sorted entity list.

### 3. Create sprite sheet animation system

For entities with `animationFrames > 1`:

**Approach A: Horizontal strip sprite sheet**
- The uploaded PNG is a horizontal strip of frames (e.g., 4 frames → image is 4x wide)
- Slice the texture into individual frame textures:
  ```ts
  const frameWidth = texture.width / animationFrames;
  const frames = [];
  for (let i = 0; i < animationFrames; i++) {
    frames.push(new Texture(texture.baseTexture, new Rectangle(i * frameWidth, 0, frameWidth, texture.height)));
  }
  ```
- Create an `AnimatedSprite` from the frame array
- Set `animationSpeed` from entity config (default: 0.1)
- Call `play()`

**Approach B: Numbered separate images**
- Entity references multiple asset IDs, one per frame
- Load each, create AnimatedSprite
- More flexible but more storage

**Choose Approach A** — simpler, one upload per animation.

### 4. Create AnimatedEntity component

A reusable component that:
- Checks if entity has `animationFrames > 1`
- If yes: creates AnimatedSprite with sliced textures
- If no: creates regular Sprite
- Handles loading state (placeholder while texture loads)
- Applies anchor, position, depth

### 5. Support animation configuration

Each animated entity can have:
- `animationFrames: number` — how many frames in the strip
- `animationSpeed: number` — playback speed (default 0.1 = ~6fps at 60fps)
- Animation plays automatically and loops forever

### 6. Add decoration-specific rendering

Some decoration types have special visual treatment:
- **Streetlamps**: render with a subtle glow (additive blend circle behind)
- **Water features** (ponds, fountains): slight alpha shimmer
- **Plants/bushes**: will sway in Phase 7, just render static for now

These are optional polish items — implement if time allows.

### 7. Update seed data

Add a few decoration entities to test data:
- A streetlamp at a road tile
- A bench near a building
- A bush/tree cluster
- One animated decoration (if test sprite is available)

### 8. Handle missing sprites gracefully

When an entity's sprite URL is null or fails to load:
- Buildings: show a colored rectangle placeholder (based on category)
- Decorations: show a small circle or diamond placeholder
- Log a warning but don't crash

## Testing Steps (Chrome DevTools)

| # | What to Test | How to Verify |
|---|-------------|---------------|
| 1 | Decorations render | Decoration entities appear on the grid |
| 2 | Decoration depth | Decorations sort correctly with buildings (Y-based) |
| 3 | Decoration anchoring | Decorations anchored at bottom-center of tile |
| 4 | Animated sprite | Multi-frame sprite cycles through frames |
| 5 | Animation speed | Frames change at the configured rate |
| 6 | Animation loops | Animation plays continuously |
| 7 | Static sprite | Single-frame entities render as regular sprites |
| 8 | Missing sprite | Entities without sprites show placeholders |
| 9 | Mixed rendering | Buildings and decorations render together, sorted correctly |
| 10 | Performance | No frame drops with 10-15 entities on screen |
| 11 | Console clean | No errors in Chrome DevTools |

## Checklist

- [ ] Context7 docs fetched for PixiJS AnimatedSprite
- [ ] Decorations render from unified entities table
- [ ] Decorations use same depth sorting as buildings
- [ ] Sprite sheet slicing works (horizontal strip → frame array)
- [ ] AnimatedEntity component created
- [ ] Multi-frame sprites animate correctly
- [ ] Animation speed is configurable
- [ ] Animations loop continuously
- [ ] Single-frame entities render as regular Sprite
- [ ] Missing sprites show placeholders
- [ ] Seed data includes decoration entities
- [ ] Buildings + decorations render together correctly
- [ ] No console errors
- [ ] No performance issues

## Acceptance Criteria

1. Decoration entities render on the grid alongside buildings
2. Depth sorting works correctly for mixed buildings and decorations
3. Multi-frame sprite sheets animate (frames cycle at configured speed)
4. Single-frame entities render as static sprites
5. Missing or failed sprites show a fallback placeholder

## Files to Create / Modify

| Action | File |
|--------|------|
| Create | `src/components/AnimatedEntity.tsx` (sprite or animated sprite) |
| Create | `src/lib/spriteSheetUtils.ts` (frame slicing utilities) |
| Modify | `src/components/EntityLayer.tsx` (use AnimatedEntity, render decorations) |
| Modify | `convex/seed.ts` (add decoration test data) |

## Blockers / Notes

_Updated during development._
