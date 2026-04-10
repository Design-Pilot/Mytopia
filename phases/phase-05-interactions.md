# Phase 5: Interactions

## Goal

Add hover effects, click selection, tooltips, touch support, and cursor changes so users can interact with buildings on the map.

## Prerequisites

- Phase 4 complete (buildings render on the grid with depth sorting)

## Tech Involved

- PixiJS 8 (eventMode, pointer events, filters)
- @pixi/react (event callbacks on components)
- React (state, portals for tooltip)
- Tailwind CSS (tooltip styling)

## Detailed Tasks

### 1. Enable interactivity on building sprites

Set `eventMode: 'static'` on each building sprite/container in EntityLayer. This tells PixiJS to process pointer events for that object.

Set `cursor: 'pointer'` so the browser cursor changes on hover.

### 2. Implement hover detection

On each building sprite:
- `onPointerEnter` → set hovered state
- `onPointerLeave` → clear hovered state

Track in React state: `hoveredEntityId: string | null`

### 3. Implement hover visual effect

When a building is hovered:
- Scale up slightly: `scale: 1.05` with a smooth transition
- Apply a brightness filter: `ColorMatrixFilter` with brightness +0.15
- Or use a simpler approach: adjust `tint` to a lighter color

When hover ends:
- Return to `scale: 1.0` and remove filter/tint

### 4. Create Tooltip component

A React component rendered outside the PixiJS canvas (as a DOM overlay):

```tsx
<div className="fixed z-50 pointer-events-none" style={{ left: tooltipX, top: tooltipY }}>
  <div className="rounded-lg bg-slate-900/90 px-4 py-3 text-white shadow-xl backdrop-blur">
    <h3 className="font-semibold">{building.name}</h3>
    <p className="text-sm text-slate-300">{building.description}</p>
    {building.techStack && (
      <div className="mt-2 flex gap-1">
        {building.techStack.map(tech => (
          <span className="rounded bg-slate-700 px-1.5 py-0.5 text-xs">{tech}</span>
        ))}
      </div>
    )}
    {building.url && (
      <p className="mt-1 text-xs text-blue-400">{building.url}</p>
    )}
  </div>
</div>
```

### 5. Position tooltip near cursor

On hover, capture the pointer's viewport position:
- Use the PixiJS pointer event's `global` coordinates
- Convert to screen coordinates for the tooltip div
- Offset slightly (e.g., +16px right, +16px down) so it doesn't cover the cursor
- Keep tooltip within viewport bounds (flip if near edges)

### 6. Implement click to select

On each building sprite:
- `onPointerTap` → toggle selection

Track in React state: `selectedEntityId: string | null`

Visual effect for selected building:
- Golden glow: `DropShadowFilter` with gold color
- Or golden tint ring around the sprite
- Selection indicator dot below the building

### 7. Click elsewhere to deselect

On the tile layer or background:
- `onPointerTap` → clear selection (set `selectedEntityId` to null)

Make sure building clicks stop propagation so they don't also trigger background deselect.

### 8. Implement touch support

Touch behavior differs from mouse:
- **Tap on building**: show tooltip (like click, not hover)
- **Tap on empty area**: dismiss tooltip
- **Drag**: pan the map (already implemented in Phase 2)
- **Tap while tooltip showing**: if same building, dismiss; if different, show new

Track interaction mode: `"mouse" | "touch"` based on pointer event type.

### 9. Update cursor states

| Context | Cursor |
|---------|--------|
| Over empty grid | `grab` |
| While dragging grid | `grabbing` |
| Over building | `pointer` |
| While in placement mode (future) | `crosshair` |

### 10. Handle hover during pan

When the user starts dragging:
- Dismiss any active hover/tooltip
- Don't trigger hover events during drag
- Resume hover detection on pointerup

## Testing Steps (Chrome DevTools)

| # | What to Test | How to Verify |
|---|-------------|---------------|
| 1 | Hover highlight | Mouse over building → it brightens/scales slightly |
| 2 | Hover tooltip | Tooltip div appears near cursor with building info |
| 3 | Tooltip content | Tooltip shows name, description, tech stack, URL |
| 4 | Tooltip positioning | Tooltip stays within viewport (flip near edges) |
| 5 | Hover leave | Mouse away from building → highlight clears, tooltip hides |
| 6 | Click select | Click building → golden glow / selection indicator |
| 7 | Click deselect | Click empty area → selection clears |
| 8 | Touch tap | Touch device: tap building shows tooltip |
| 9 | Touch dismiss | Touch empty area dismisses tooltip |
| 10 | Cursor changes | Cursor is `pointer` on buildings, `grab` on grid |
| 11 | No hover during pan | Start dragging → tooltip dismisses, no hover flicker |
| 12 | Console clean | No errors in Chrome DevTools |

## Checklist

- [ ] Building sprites have `eventMode: 'static'` and `cursor: 'pointer'`
- [ ] Hover detection works (onPointerEnter / onPointerLeave)
- [ ] Hover visual effect (scale + brightness or tint)
- [ ] Tooltip component created with Tailwind styling
- [ ] Tooltip positioned near cursor
- [ ] Tooltip stays within viewport bounds
- [ ] Tooltip shows building metadata (name, description, techStack, url)
- [ ] Click selects building (golden glow)
- [ ] Click empty area deselects
- [ ] Touch tap shows tooltip
- [ ] Touch empty area dismisses tooltip
- [ ] Cursor states correct (grab, grabbing, pointer)
- [ ] Hover dismissed during pan/drag
- [ ] No console errors

## Acceptance Criteria

1. Hovering over a building shows a visual highlight and a tooltip with building info
2. Clicking a building selects it (visible glow); clicking elsewhere deselects
3. Touch interactions work: tap to show, tap elsewhere to dismiss
4. Cursor changes appropriately (grab on grid, pointer on buildings)
5. No interactions fire during pan/drag

## Files to Create / Modify

| Action | File |
|--------|------|
| Create | `src/components/Tooltip.tsx` (building info tooltip) |
| Create | `src/hooks/useInteractions.ts` (hover/select state management) |
| Modify | `src/components/EntityLayer.tsx` (add event handlers) |
| Modify | `src/components/IsometricGrid.tsx` (pass interaction state, render tooltip) |
| Modify | `src/app/page.tsx` (state management for hover/select) |

## Blockers / Notes

_Updated during development._
