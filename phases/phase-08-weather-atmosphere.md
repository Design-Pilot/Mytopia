# Phase 8: Weather & Atmosphere

## Goal

Implement a cloud system with drifting cloud sprites and matching cloud shadows on the ground. Set up weather state management for future rain/snow/leaves.

## Prerequisites

- Phase 7 complete (shadow layer exists, ambient layer exists)

## Tech Involved

- PixiJS 8 (Sprite, Container, Texture, TilingSprite)
- @pixi/react
- anime.js or PixiJS ticker (cloud movement)
- Convex (weather state in world config)

## Detailed Tasks

### 1. Create cloud sprites

Cloud visuals need 5-8 pre-made cloud PNG images:
- Semi-transparent white/light grey
- Various sizes and shapes
- Soft edges (feathered alpha)

**For development**: create simple procedural clouds using PixiJS Graphics:
- Draw soft white ellipses at various sizes
- Group 2-3 ellipses into a cloud formation
- This avoids needing actual PNG assets during development

**For production**: replace with AI-generated cloud PNGs uploaded through admin.

### 2. Create WeatherLayer component

A PixiJS Container at z=4 (above AmbientLayer):

```tsx
<Container zIndex={4} sortableChildren>
  <Container zIndex={0}>  {/* Cloud shadows on ground */}
    {clouds.map(cloud => <CloudShadow key={cloud.id} ... />)}
  </Container>
  <Container zIndex={1}>  {/* Clouds in sky */}
    {clouds.map(cloud => <CloudSprite key={cloud.id} ... />)}
  </Container>
</Container>
```

**Note**: Cloud shadows actually need to render near the ground level (between tiles and entities), not at z=4. Consider rendering cloud shadows in the ShadowLayer or a dedicated layer at z=0.5.

### 3. Implement cloud drift animation

Each cloud has:
- `x, y` position (world coordinates)
- `speed` (pixels per second, randomized: 8-20)
- `opacity` (0.3-0.7)
- `scale` (0.8-1.5)

Movement logic (in PixiJS ticker or anime.js):
```ts
cloud.x += cloud.speed * delta;

// Wrap around when cloud exits right side of world
if (cloud.x > worldWidth + cloudWidth) {
  cloud.x = -cloudWidth;
  cloud.y = randomY(); // randomize vertical position on wrap
}
```

### 4. Implement cloud shadows

For each cloud, render a matching shadow on the ground:
- Same shape as cloud but darker (black, alpha 0.08-0.12)
- Offset from cloud position to simulate sun angle
- Moves in sync with cloud (same speed)
- Rendered on ground level (between tiles and entities)

Shadow offset: `(shadowX = cloudX + 30, shadowY = cloudY + 60)` — simulates sun high and to the left.

### 5. Implement weather state management

The `world` table has a `weather` field: `"clear" | "cloudy" | "overcast"`

| Weather | Cloud Count | Cloud Opacity | Cloud Speed |
|---------|-------------|---------------|-------------|
| clear | 2-3 | 0.2-0.4 | slow (8-12 px/s) |
| cloudy | 5-7 | 0.4-0.6 | medium (12-18 px/s) |
| overcast | 8-10 | 0.6-0.8 | faster (15-22 px/s) |

When weather state changes (from Convex), smoothly transition:
- Fade in/out clouds to match new count
- Adjust opacity and speed

### 6. Initialize cloud positions

On first render:
- Distribute clouds randomly across the world width
- Randomize Y positions within the upper portion of the world
- Randomize sizes and speeds within the weather preset ranges
- This prevents all clouds starting at the left edge

### 7. Handle camera zoom interaction

Clouds should feel like they're at a higher altitude:
- Option A: Clouds move slower when zoomed in (parallax effect)
- Option B: Clouds are always at full speed regardless of zoom

**Choose Option A** — subtle parallax adds depth. Cloud speed = `baseSpeed * (1 / zoom * 0.5 + 0.5)`.

### 8. Prepare particle system infrastructure

Install and configure `@pixi/particle-emitter` for future use:
- Verify the import works
- Create a placeholder `ParticleLayer` component (empty for now)
- This will be used for rain, snow, and leaves in future phases

### 9. Add weather control (temporary dev UI)

Create a simple floating button group to toggle weather states for testing:
```tsx
<div className="fixed bottom-4 left-4 z-50 flex gap-2">
  <button onClick={() => setWeather("clear")}>Clear</button>
  <button onClick={() => setWeather("cloudy")}>Cloudy</button>
  <button onClick={() => setWeather("overcast")}>Overcast</button>
</div>
```

This is a dev tool — it writes to Convex `world.weather` so the change is reactive.

## Testing Steps (Chrome DevTools)

| # | What to Test | How to Verify |
|---|-------------|---------------|
| 1 | Clouds visible | Semi-transparent cloud shapes float across the screen |
| 2 | Cloud movement | Clouds drift left to right at varying speeds |
| 3 | Cloud wrap | Clouds that exit the right side reappear on the left |
| 4 | Cloud shadows | Dark blobs on the ground move in sync with clouds |
| 5 | Shadow layer order | Cloud shadows appear between tiles and buildings |
| 6 | Clear weather | 2-3 light, slow clouds |
| 7 | Cloudy weather | 5-7 medium opacity, medium speed clouds |
| 8 | Overcast weather | 8-10 dense, faster clouds |
| 9 | Weather toggle | Dev buttons switch weather states smoothly |
| 10 | Cloud parallax | Zooming in makes clouds appear to drift slower |
| 11 | Initial distribution | On load, clouds are spread across screen (not bunched at left) |
| 12 | Performance | Clouds render at 60fps |
| 13 | Console clean | No errors |

## Checklist

- [ ] Procedural cloud graphics created (dev placeholder)
- [ ] WeatherLayer component created (z=4)
- [ ] Cloud sprites render and drift across screen
- [ ] Clouds wrap around when exiting viewport
- [ ] Cloud speeds randomized within range
- [ ] Cloud opacities randomized within range
- [ ] Cloud shadows render on ground level
- [ ] Shadows track cloud positions with offset
- [ ] Weather state read from Convex world config
- [ ] "clear" preset: few light clouds
- [ ] "cloudy" preset: moderate clouds
- [ ] "overcast" preset: many dense clouds
- [ ] Weather transitions smooth
- [ ] Clouds distributed randomly on initial load
- [ ] Parallax effect on zoom
- [ ] Dev weather toggle buttons work
- [ ] @pixi/particle-emitter imported and verified
- [ ] Performance at 60fps
- [ ] No console errors

## Acceptance Criteria

1. Semi-transparent clouds drift across the screen and wrap around
2. Cloud shadows move on the ground in sync with clouds
3. Weather states (clear/cloudy/overcast) change cloud count, opacity, and speed
4. Switching weather via dev controls updates the scene smoothly
5. Clouds have parallax effect when zooming

## Files to Create / Modify

| Action | File |
|--------|------|
| Create | `src/components/WeatherLayer.tsx` |
| Create | `src/components/CloudSprite.tsx` (individual cloud) |
| Create | `src/components/CloudShadow.tsx` (individual shadow) |
| Create | `src/lib/weatherPresets.ts` (preset configs) |
| Create | `src/components/DevWeatherControls.tsx` (temp dev UI) |
| Modify | `src/components/IsometricGrid.tsx` (add WeatherLayer) |
| Modify | `convex/world.ts` (weather field mutations) |

## Blockers / Notes

_Updated during development._

**Cloud shadow z-order**: Cloud shadows need to be on a layer between tiles and entities, NOT in the WeatherLayer at z=4. May need a separate `CloudShadowLayer` at z=0.5 or render them inside the ShadowLayer.
