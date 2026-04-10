# Phase 9: Day/Night + Seasons

## Goal

Implement time-of-day color grading with 5 presets, streetlamp on/off behavior, dynamic shadow offset, and seasonal asset swapping.

## Prerequisites

- Phase 7 complete (shadows exist with configurable offset, decorations render)

## Tech Involved

- PixiJS 8 (ColorMatrixFilter, Container filters)
- @pixi/react
- Convex (world.timeOfDay, world.season)
- anime.js (smooth transitions between presets)

## Detailed Tasks

### 1. Research PixiJS ColorMatrixFilter

Use context7 to fetch PixiJS 8 docs for:
- `ColorMatrixFilter` — brightness, contrast, saturate, hue
- How to apply filters to a Container (all children affected)
- Filter performance considerations

### 2. Define time-of-day presets

| Preset | Brightness | Contrast | Saturation | Hue Shift | Tint Overlay |
|--------|-----------|----------|------------|-----------|-------------|
| dawn | 0.9 | 1.0 | 0.85 | +10 (warm) | rgba(255, 180, 100, 0.08) |
| daylight | 1.0 | 1.0 | 1.0 | 0 | none |
| goldenHour | 1.05 | 1.05 | 1.1 | +15 (warm) | rgba(255, 160, 60, 0.1) |
| dusk | 0.75 | 1.05 | 0.7 | +5 (cool) | rgba(80, 60, 140, 0.12) |
| night | 0.45 | 1.1 | 0.4 | -10 (blue) | rgba(20, 30, 80, 0.2) |

Store these in `src/lib/timePresets.ts`.

### 3. Create FilterLayer

Apply a `ColorMatrixFilter` to the main world container (or a wrapper around all layers):

```tsx
<Container filters={[colorMatrixFilter]}>
  <TileLayer />
  <ShadowLayer />
  <EntityLayer />
  <AmbientLayer />
</Container>
<WeatherLayer />  {/* clouds above the filter */}
```

**Important**: Clouds should NOT be affected by the day/night filter — clouds are self-lit. Only the ground-level content gets filtered.

### 4. Implement smooth transitions

When time of day changes, don't snap — smoothly interpolate:
- Use anime.js to tween filter values over 1-2 seconds
- Animate brightness, contrast, saturation, hue simultaneously

```js
animate(colorMatrixFilter, {
  brightness: targetPreset.brightness,
  // ... etc
  duration: 1500,
  easing: 'easeInOutSine',
});
```

**Note**: PixiJS ColorMatrixFilter methods (`.brightness()`, `.saturate()`) reset the matrix. May need to build the matrix manually or apply adjustments sequentially.

### 5. Implement streetlamp behavior

Streetlamp decorations should:
- **Daylight / dawn / goldenHour**: lamp off (normal sprite)
- **Dusk**: lamp turns on (add warm glow circle behind lamp)
- **Night**: lamp fully on (larger glow circle, brighter)

Glow implementation:
- Draw a `Graphics` circle behind the streetlamp sprite
- Fill: radial gradient effect (or solid circle with soft alpha)
- Color: warm yellow `#ffd866`, alpha: 0.3 (dusk) or 0.5 (night)
- Blend mode: ADD for a glow effect

Track lamp state based on `world.timeOfDay`.

### 6. Dynamic shadow offset

Shadow offset changes with time of day to simulate sun position:

| Time | Shadow Offset X | Shadow Offset Y | Shadow Alpha |
|------|----------------|----------------|-------------|
| dawn | -12 | +3 | 0.15 (long, faint) |
| daylight | +8 | +4 | 0.2 (short, clear) |
| goldenHour | +16 | +6 | 0.18 (long, warm) |
| dusk | -16 | +8 | 0.12 (long, faint) |
| night | 0 | 0 | 0.05 (minimal) |

Update ShadowLayer to read shadow offset from a computed value based on time preset.

### 7. Define season presets

| Season | Color Adjustment | Asset Swap | Description |
|--------|-----------------|------------|-------------|
| spring | slight green boost | spring trees (blossoms) | Fresh, light |
| summer | normal (baseline) | summer trees (full green) | Default |
| autumn | warm, orange shift | autumn trees (orange/red) | Warm tones |
| winter | cool, desaturated | winter trees (bare/snow) | Cold, muted |

### 8. Implement seasonal asset swapping

Entities can have `seasonalAssets` field with asset IDs per season:
```ts
seasonalAssets: {
  spring: assetId_spring,
  summer: assetId_summer,
  autumn: assetId_autumn,
  winter: assetId_winter,
}
```

When `world.season` changes:
- Look up the entity's seasonal asset for the active season
- Swap the sprite texture
- Fall back to the entity's default `assetId` if no seasonal variant exists

### 9. Apply seasonal color grading

Layer a subtle season filter on top of the time-of-day filter:

| Season | Hue Shift | Saturation | Notes |
|--------|-----------|------------|-------|
| spring | +5 (green) | 1.05 | Slightly more vivid |
| summer | 0 | 1.0 | Baseline |
| autumn | +12 (warm) | 0.95 | Warm shift |
| winter | -8 (cool) | 0.8 | Desaturated, blue |

Combine with time-of-day values (multiply/add).

### 10. Add dev controls for time and season

Extend the dev controls from Phase 8:
```tsx
<div className="fixed bottom-4 left-4 z-50 space-y-2">
  <div className="flex gap-2">
    <button>Dawn</button>
    <button>Day</button>
    <button>Golden</button>
    <button>Dusk</button>
    <button>Night</button>
  </div>
  <div className="flex gap-2">
    <button>Spring</button>
    <button>Summer</button>
    <button>Autumn</button>
    <button>Winter</button>
  </div>
</div>
```

These write to Convex `world.timeOfDay` and `world.season`.

## Testing Steps (Chrome DevTools)

| # | What to Test | How to Verify |
|---|-------------|---------------|
| 1 | Daylight preset | Default look — normal brightness and colors |
| 2 | Dawn preset | Slight warm tint, slightly darker |
| 3 | Golden hour preset | Warm orange tint, slightly brighter |
| 4 | Dusk preset | Purple/cool tint, noticeably darker |
| 5 | Night preset | Dark blue tint, very dark, low saturation |
| 6 | Smooth transition | Switching presets fades smoothly (no snap) |
| 7 | Clouds unaffected | Clouds stay white/grey regardless of time filter |
| 8 | Streetlamp off | Lamps have no glow during day/dawn/golden |
| 9 | Streetlamp on | Lamps glow warm yellow at dusk/night |
| 10 | Shadow offset dawn | Shadows stretch to the right (morning sun from left) |
| 11 | Shadow offset night | Shadows nearly invisible |
| 12 | Season summer | Default look, green trees |
| 13 | Season autumn | Warm tint + trees swap to orange/red variants |
| 14 | Season winter | Cool tint + trees swap to bare/snowy variants |
| 15 | Season spring | Green tint + trees swap to blossom variants |
| 16 | Combined | Night + winter looks different from night + summer |
| 17 | Dev controls | All buttons work and update instantly |
| 18 | Console clean | No errors |

## Checklist

- [ ] Context7 docs fetched for PixiJS ColorMatrixFilter
- [ ] Time-of-day presets defined in `timePresets.ts`
- [ ] ColorMatrixFilter applied to world container
- [ ] Daylight preset looks normal (baseline)
- [ ] Dawn preset: warm, slightly dark
- [ ] Golden hour: warm orange glow
- [ ] Dusk: cool purple, darker
- [ ] Night: dark blue, very desaturated
- [ ] Transitions smooth (anime.js tween, 1-2s)
- [ ] Clouds NOT affected by day/night filter
- [ ] Streetlamps glow at dusk/night
- [ ] Streetlamp glow uses additive blending
- [ ] Shadow offset changes with time of day
- [ ] Shadow alpha changes with time of day
- [ ] Season presets defined
- [ ] Seasonal asset swap works for entities with variants
- [ ] Seasonal color grading applied
- [ ] Combined time + season produces unique looks
- [ ] Dev controls for time and season work
- [ ] No console errors

## Acceptance Criteria

1. Each time-of-day preset produces a visually distinct scene
2. Transitions between presets are smooth (no jarring snaps)
3. Streetlamps turn on at dusk/night with a visible glow
4. Shadow offsets shift with time of day
5. Changing season swaps entity sprites (if variants exist) and adjusts color grading
6. Clouds remain unaffected by the day/night filter

## Files to Create / Modify

| Action | File |
|--------|------|
| Create | `src/lib/timePresets.ts` (time-of-day preset values) |
| Create | `src/lib/seasonPresets.ts` (season preset values) |
| Create | `src/components/StreetlampGlow.tsx` (lamp glow effect) |
| Create | `src/hooks/useTimeFilter.ts` (manages filter + transitions) |
| Modify | `src/components/IsometricGrid.tsx` (wrap layers in filtered container) |
| Modify | `src/components/ShadowLayer.tsx` (dynamic offset from time) |
| Modify | `src/components/EntityLayer.tsx` (seasonal asset swap) |
| Modify | `src/components/DevWeatherControls.tsx` (add time/season buttons) |
| Modify | `convex/world.ts` (mutations for timeOfDay, season) |

## Blockers / Notes

_Updated during development._

**ColorMatrixFilter caveat**: PixiJS's ColorMatrixFilter methods like `.brightness()` REPLACE the current matrix — they don't stack. To combine brightness + saturation + hue, either apply them in sequence (chaining resets) or build a custom matrix. Research this before implementing.
