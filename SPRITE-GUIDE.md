# Sprite Generation Guide

Visual specs for generating AI sprites that sit perfectly on the Mytopia isometric grid.

## Grid Parameters

| Parameter | Value |
|---|---|
| Projection | 2:1 isometric (diamond tiles) |
| Tile size | 64 x 32 px (width x height) |
| Camera angle | ~30 deg from horizontal (looking down at ~60 deg from vertical) |
| Sprite anchor | bottom-center (0.5, 1.0) |
| Sprite scaling | uniform — image width is scaled to match footprint width; height scales proportionally |
| Zoom range | 0.4x to 3x (default 1.0x) |
| Display density | 2x retina (canvas renders at `devicePixelRatio`) |

## Footprint Sizes

The engine scales each sprite so its pixel width matches the footprint's screen width:

| Footprint | Display width (CSS px) | Image width at 2x |
|---|---|---|
| 1x1 | 64 px | 128 px |
| 1x2 or 2x1 | 96 px | 192 px |
| 2x2 | 128 px | 256 px |
| 3x3 | 192 px | 384 px |

## Recommended Canvas Sizes

All sizes are 2x resolution for retina crispness. On a 2x display at zoom 1.0, these map 1:1 to physical pixels.

| Entity type | Footprint | Canvas (W x H) | Aspect ratio |
|---|---|---|---|
| Small decoration (tree, bush, lamp, sign) | 1x1 | 128 x 192 | 2:3 |
| Tall decoration (large tree, statue) | 1x1 | 128 x 256 | 1:2 |
| Small building (kiosk, booth, shed) | 1x1 | 128 x 256 | 1:2 |
| Medium building (house, shop) | 2x2 | 256 x 384 | 2:3 |
| Large building (office, landmark) | 3x3 | 384 x 512 | 3:4 |
| Vehicle | 1x1 | 128 x 128 | 1:1 |

## How Sprites Are Rendered

1. The sprite image is loaded at its original resolution.
2. A uniform scale factor is computed: `scale = footprintDisplayWidth / imageWidth`.
3. The sprite is drawn with anchor `(0.5, 1.0)` — the **bottom-center** of the image is placed at the **bottom vertex** of the footprint diamond.
4. Height scales proportionally with the same factor — taller images just extend further upward.

This means:
- The **base** of the object in the image should align with the **bottom edge** of the canvas.
- The object should be **centered horizontally** in the canvas.
- Transparent space above the object is fine (it simply extends the sprite upward).
- Transparent space below the object will cause it to **float above the ground**.

## AI Image Generation Prompt

Copy and adapt this prompt. Replace `[describe the object]` and `[W] x [H]` with the appropriate values from the tables above.

---

**Isometric pixel-art sprite for a city-builder game.**

**Subject:** [describe the object — e.g. "a cozy two-story bookshop with a red awning and warm window glow"]

**Visual rules (follow exactly):**
- **Camera:** 2:1 isometric projection, viewed from above-right at approximately 30 degrees from horizontal (the classic SimCity / Habbo angle). The front-left and front-right faces of the object are visible; the top is visible.
- **Isometric angle:** The building's base edges must run at exactly 26.57 degrees from horizontal (arctan 0.5), matching a 2:1 isometric diamond where tile width = 2x tile height. The front corner of the base points directly downward.
- **Canvas:** [W] x [H] pixels, transparent background (PNG with alpha).
- **Positioning:** The object must be centered horizontally. The base of the object sits at the very bottom of the canvas — no gap between the object's ground contact and the bottom pixel row. Leave empty transparent space above.
- **Style:** Clean, detailed pixel art or painterly-pixel hybrid. Crisp outlines, visible surface detail, warm and inviting palette.
- **Lighting:** Soft directional light from the top-left. Subtle shading on the right face and under overhangs.
- **No drop shadow** — shadows are rendered separately by the engine.
- **No ground plane or terrain** — just the object floating on transparency.
- **Edges:** Anti-aliased edges are fine, but keep them tight — no glow, bloom, or wide soft halos around the object. The silhouette should read clearly at 50% display size.
- **Fill the width:** The object should span roughly 80-95% of the canvas width so it uses the available space well.
- **No text, no UI, no watermark.**

---

## Animated Sprites

For animated entities (fountains, flags, flickering lights):

1. Create all frames at the same canvas size.
2. Arrange them in a **single horizontal strip** — frame 1, frame 2, frame 3, etc., side by side.
3. Total image width = `frameWidth x frameCount`.
4. Set `animationFrames` on the entity to the frame count.
5. Optionally set `animationSpeed` (default 0.1, range ~0.05 to 0.3).

Example: a 3-frame fountain at 1x1 footprint = 384 x 192 px strip (128px per frame x 3 frames, 192px tall).

## Checklist Before Uploading

- [ ] Transparent PNG background (no white/colored background)
- [ ] Object base touches the bottom pixel row (no gap)
- [ ] Object is centered horizontally
- [ ] Canvas width matches the footprint table above
- [ ] No drop shadow baked into the image
- [ ] No ground/terrain plane visible
- [ ] Isometric angle roughly matches 2:1 (base edges at ~26.6 degrees)
- [ ] Details are legible when the image is viewed at 50% size (simulates 1x display at zoom 1.0)
