# Phase 2: Isometric Grid + Camera

## Goal

Render a 10x10 isometric diamond grid using PixiJS Graphics inside @pixi/react, with smooth zoom-toward-pointer and drag-to-pan controls.

## Prerequisites

- Phase 1 complete (project scaffolded, PixiJS Stage renders)

## Tech Involved

- PixiJS 8 (Graphics, Container)
- @pixi/react (Stage, Container, Graphics components)
- `isoMath.ts` (tileToScreen, screenToTile)
- React state for camera (zoom, panX, panY)

## Detailed Tasks

### 1. Research @pixi/react Stage and Graphics API

Use context7 to fetch current @pixi/react docs. Understand:

- How `<Stage>` component works (props, resize handling)
- How `<Graphics>` component draws shapes (the `draw` callback pattern)
- How `<Container>` nesting and transforms work

### 2. Create IsometricGrid component

Component structure:

```
<Stage width={window.innerWidth} height={window.innerHeight}>
  <Container x={panX} y={panY} scale={zoom}>
    <Graphics draw={drawTiles} />    ← draws all diamond tiles
  </Container>
</Stage>
```

The `<Container>` holds all world content. Zoom and pan are applied to this single container. The camera IS the container transform.

### 3. Draw diamond tiles

Using PixiJS Graphics `draw` callback:

- Loop through 10x10 grid
- For each tile, call `tileToScreen(x, y, originX, originY)` to get screen position
- Draw a diamond polygon: `moveTo(centerX, top)` → `lineTo(right, centerY)` → `lineTo(centerX, bottom)` → `lineTo(left, centerY)` → `closePath()`
- Fill with grass green color (slight noise variation per tile)

### 4. Calculate grid origin

Center the grid in the viewport:

- `originX = gridHeight * (tileWidth / 2)` (so the grid's left corner is near x=0)
- `originY = tileHeight` (small top padding)
- Set initial `panX` and `panY` so grid center is at viewport center

### 5. Implement zoom controls

Attach wheel listener with `{ passive: false }` via `useEffect` on the Stage's parent div:

- **Mouse wheel** (large deltaY, no deltaX): zoom in/out toward pointer
- **Ctrl+wheel** (trackpad pinch): zoom toward pointer, prevent browser zoom
- **Trackpad two-finger scroll** (deltaX > 0 or small deltaY): pan

Zoom-toward-pointer algorithm:

```
worldPointBefore = (pointerX - panX) / oldZoom
newPan = pointerX - worldPointBefore * newZoom
```

Zoom limits: min 0.4, max 3.0.

### 6. Implement pan controls

- **Drag pan**: pointerdown → track start position, pointermove → update panX/panY, pointerup → stop
- Distinguish drag from click: only count as drag if pointer moved > 3px
- Cursor: `grab` default, `grabbing` while dragging

### 7. Implement pinch zoom (mobile)

Track two touch pointers. When both are down, calculate distance between them. On move, scale zoom proportionally to distance change.

### 8. Handle Stage resize

When the browser window resizes, update the Stage `width` and `height` props. Use a `useEffect` with `resize` event listener or @pixi/react's built-in resize handling.

### 9. Add tile hover highlight

Track which tile the pointer is over:

- Convert pointer position to world coordinates: `worldX = (pointerX - panX) / zoom`
- Use `screenToTile(worldX, worldY, ...)` to get tile coordinates
- If valid tile, draw a brighter or outlined diamond at that position
- Use a separate `<Graphics>` layer for the highlight

## Testing Steps (Chrome DevTools)


| #   | What to Test          | How to Verify                                                 |
| --- | --------------------- | ------------------------------------------------------------- |
| 1   | Grid renders          | 10x10 diamond grid visible on screen                          |
| 2   | Grid is isometric     | Tiles form a diamond pattern (not a flat square grid)         |
| 3   | Mouse wheel zoom      | Scroll wheel zooms in/out; grid scales around cursor position |
| 4   | Trackpad pinch zoom   | Ctrl+scroll zooms without triggering browser zoom             |
| 5   | Trackpad pan          | Two-finger scroll on trackpad pans the grid                   |
| 6   | Drag pan              | Click and drag moves the grid; cursor changes to grabbing     |
| 7   | Zoom limits           | Can't zoom below 0.4x or above 3.0x                           |
| 8   | Grid centered on load | Grid appears centered in viewport on first load               |
| 9   | Window resize         | Resize browser window; canvas adjusts to fill viewport        |
| 10  | Tile hover            | Moving mouse over grid highlights the tile under cursor       |
| 11  | No browser zoom       | Pinch/ctrl+scroll does NOT zoom the whole page                |
| 12  | Console clean         | No errors in Chrome DevTools Console                          |


## Checklist

- Context7 docs fetched for @pixi/react Stage, Graphics, Container
- IsometricGrid component created
- Diamond tiles render in isometric layout
- Grid origin calculated and grid centered on load
- Wheel zoom implemented with `{ passive: false }` listener
- Zoom-toward-pointer works correctly
- Trackpad pan works (two-finger scroll)
- Drag pan works (click + drag)
- Drag vs click distinguished (3px threshold)
- Cursor changes (grab / grabbing)
- Pinch zoom works on touch devices
- Zoom clamped to min/max limits
- Stage resizes with browser window
- Tile hover highlight shows on mouseover
- No browser zoom hijacking
- No console errors

## Acceptance Criteria

1. A 10x10 isometric diamond grid renders in the center of the viewport
2. Mouse wheel zooms toward the pointer position (not toward center)
3. Dragging the canvas pans the grid
4. Trackpad pinch-zoom works without triggering browser zoom
5. Hovering over a tile shows a visual highlight
6. The grid stays centered after window resize

## Files to Create / Modify


| Action | File                                                                 |
| ------ | -------------------------------------------------------------------- |
| Create | `src/components/IsometricGrid.tsx` (or rename IsometricCanvas)       |
| Create | `src/components/TileGraphics.tsx` (tile drawing component)           |
| Create | `src/hooks/useCamera.ts` (zoom/pan state + handlers)                 |
| Modify | `src/app/page.tsx` (wire up IsometricGrid)                           |
| Modify | `src/lib/isoMath.ts` (add constants: TILE_W, TILE_H, GRID_W, GRID_H) |


## Blockers / Notes

- Implemented with `**<Application>` + `<pixiContainer>`** from @pixi/react v8 (not legacy `<Stage>`).
- `**TileGraphics.tsx`** was folded into `IsometricGrid.tsx` (single place for tile + hover `Graphics` layers).
- **Pinch:** two-finger touch updates zoom from initial finger span; midpoint used for zoom-to-point.
- **Trackpad:** horizontal-dominant wheel deltas pan; vertical zooms; **Ctrl/Meta + wheel** zooms and calls `preventDefault()` to avoid browser page zoom.

