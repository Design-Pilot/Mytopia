# Phase 4: Tiles + Buildings

## Goal

Render tile types (grass, water, road) with distinct visuals and load building sprites from Convex onto the grid with correct depth sorting.

## Prerequisites

- Phase 2 complete (isometric grid renders, camera works)
- Phase 3 complete (Convex data layer, useWorldData hook)

## Tech Involved

- PixiJS 8 (Graphics, Sprite, Texture, Container)
- @pixi/react (Graphics, Sprite, Container components)
- Convex file storage (sprite URLs)
- `useWorldData()` hook

## Detailed Tasks

### 1. Replace hardcoded grid with Convex data

Update IsometricGrid to use `useWorldData()`:
- Grid dimensions from `worldData.world.gridWidth/gridHeight`
- Tile types from `worldData.tileGrid[y][x]`
- Replace the static 10x10 grid with dynamic data

### 2. Implement tile type rendering

Each tile type has a distinct visual:

| Tile Type | Color | Description |
|-----------|-------|-------------|
| grass | `#6ab348` with noise | Default ground, slight green variation per tile |
| water | `#4a90d9` | Blue diamond, slightly transparent |
| road | `#7a7a7a` | Grey diamond, flat look |

Draw each diamond with the appropriate fill color based on `tileGrid[y][x]`.

### 3. Add tile accents (optional visual polish)

- Grass: random tiny dots of darker/lighter green
- Water: slightly different blue shade per tile (simulates depth)
- Road: thin lighter line down the center (lane marking)

Keep this simple — don't over-engineer. These are colored diamonds.

### 4. Create EntityRenderer component

A PixiJS Container that renders all entities from `worldData.entities`:
- Filter by type if needed (buildings first, decorations in Phase 6)
- For each entity with a `spriteUrl`:
  - Load texture from URL using `Texture.from(url)` or PixiJS Assets loader
  - Create a Sprite with that texture
  - Position at `tileToScreen(entity.gridX, entity.gridY)`

### 5. Implement depth sorting

Entities must be sorted so that objects at higher `gridY` (further down the screen) render on top:
- Sort entities by `gridX + gridY` (isometric depth key)
- Set `zIndex` on each sprite container
- Use `sortableChildren: true` on the parent container

### 6. Implement building anchoring

Building sprites should be anchored at bottom-center:
- Sprite anchor: `(0.5, 1.0)` — center-bottom
- Position: tile center X, tile bottom Y
- This makes buildings "stand" on their tile

### 7. Handle sprite loading states

Sprites load asynchronously from Convex URLs:
- Show a placeholder (small colored rectangle) while loading
- Replace with sprite once loaded
- Handle load errors gracefully (keep placeholder, log warning)

### 8. Implement sprite caching

Don't reload the same texture URL multiple times:
- Use PixiJS Assets cache (check if texture already loaded)
- Or maintain a local `Map<string, Texture>` cache

### 9. Handle footprint sizes

Buildings can span multiple tiles:
- `footprintW` and `footprintH` define the tile footprint
- Sprite should be scaled to visually cover the footprint area
- Default footprint: 1x1

### 10. Create test data

For testing without the admin editor, create a seed function or a dev helper that:
- Adds a few tile overrides (water pond, road strip)
- Adds 2-3 building entities with placeholder images (can use colored rectangles)

## Testing Steps (Chrome DevTools)

| # | What to Test | How to Verify |
|---|-------------|---------------|
| 1 | Tiles from Convex | Grid renders with data from useWorldData, not hardcoded |
| 2 | Grass tiles | Green diamonds with slight color variation |
| 3 | Water tiles | Blue diamonds where water overrides exist |
| 4 | Road tiles | Grey diamonds where road overrides exist |
| 5 | Building sprites | Building sprites appear on the grid |
| 6 | Building position | Buildings anchored at correct tile position (bottom-center) |
| 7 | Depth sorting | Building at gridY=5 renders in front of building at gridY=3 |
| 8 | Sprite loading | Placeholder shows briefly, then sprite appears |
| 9 | No console errors | No texture load errors or React warnings |
| 10 | Camera still works | Zoom/pan still function with tiles and buildings |

## Checklist

- [x] IsometricGrid uses useWorldData() instead of hardcoded data
- [x] Grass tiles render with green color + noise variation
- [x] Water tiles render with blue color
- [x] Road tiles render with grey color
- [x] EntityRenderer component created (`EntityLayer.tsx`)
- [x] Building sprites load from URLs (demo uses HTTPS; Convex `assetId` + storage still works)
- [x] Buildings anchored at bottom-center of tile / footprint
- [x] Depth sorting works (Y-based)
- [x] Sprite loading placeholder shown while loading
- [x] Sprite caching prevents duplicate loads
- [x] Building footprint sizes supported
- [x] Test data created (water, roads, 2-3 buildings)
- [x] Camera zoom/pan still works with all layers
- [x] No console errors (lint clean)

## Acceptance Criteria

1. The grid renders tile types from Convex data (grass/water/road visually distinct)
2. Building sprites load from Convex storage URLs and display at correct grid positions
3. Depth sorting is correct: entities at higher Y render in front
4. Sprites are anchored at bottom-center (buildings "stand" on their tiles)
5. Camera zoom/pan continues to work with all rendered layers

## Files to Create / Modify

| Action | File |
|--------|------|
| Create | `src/components/TileLayer.tsx` (tile rendering) |
| Create | `src/components/EntityLayer.tsx` (entity/building rendering) |
| Create | `src/lib/tileColors.ts` (tile type color definitions) |
| Create | `src/lib/spriteCache.ts` (texture caching utility) |
| Modify | `src/components/IsometricGrid.tsx` (use WorldData, add layers) |
| Modify | `convex/seed.ts` (add test entities and tile overrides) |

## Blockers / Notes

- Convex **mutations** cannot call `ctx.storage.store()` (only `generateUploadUrl`). Phase 4 demo buildings use **optional `spriteUrl`** on `entities` plus stable HTTPS images so textures load without a separate upload action. Production sprites still use **`assetId` + file storage** as in Phase 3.
