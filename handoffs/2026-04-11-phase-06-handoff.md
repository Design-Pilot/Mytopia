# Phase 6

Phase 6 decoration and animation work is now implemented on top of the existing viewer.

## Status

Done

## Plain-English summary

- The map can now render decorative entities alongside buildings instead of treating the scene as building-only.
- The renderer now supports two sprite modes: a normal single-frame sprite and a horizontal strip that gets sliced into frames and played as a looping animation.
- The seeded demo world now includes decoration examples, including a looping fountain strip, and older local demo worlds auto-upgrade themselves if they still have stale sample sprite URLs.
- The viewer label has been moved forward so the page now reflects the phase 6 milestone.

## What changed in this phase

- Added a small utility that slices one wide image into multiple frame textures for animation playback.
- Added a reusable entity renderer that can load a texture once, decide whether it is static or animated, and fall back to a clean placeholder if the sprite is missing or fails to load.
- Kept the existing interaction model intact so buildings stay interactive while decorations remain visual-only for now.
- Added a simple warm glow treatment for streetlamp-style decorations.
- Updated demo seeding so the sample buildings and decorations are maintained by name instead of duplicated blindly, which also lets existing local worlds repair outdated sample URLs automatically.

## Decisions to preserve

- Decorations still share the same depth sorting logic as buildings. The scene stays unified instead of splitting decorative objects into a separate depth layer.
- Animation currently uses a single horizontal strip image rather than multiple separate files. This keeps asset management simple and matches the phase plan.
- Decorations are not interactive yet. That keeps phase 6 focused on rendering and animation while phase 5 interaction behavior stays stable.
- The demo seeding flow is now allowed to repair older local sample data, not just create content for a brand-new world.

## Verification

- Lint: passed
- Production build: passed
- Local Convex sync: passed
- Browser sanity pass: passed after a reload
- Console warnings: cleared after the demo-world auto-upgrade replaced stale sample URLs

## Known gaps or risks

- The current sample art is intentionally simple and placeholder-like. The rendering system is ready, but the final look will improve once better decoration sprites are uploaded later.
- Animation support is currently focused on horizontal strip playback. More advanced timing control or spritesheet metadata is still out of scope.
- The decoration layer is visual-only right now, so any decoration hover or selection behavior should be treated as future work rather than an accidental omission.

## Suggested starting point for the next phase

Start Phase 7 by using the new decoration layer as the base for environmental polish. The most natural next step is adding static shadows first, then ambient motion like tree sway or simple road traffic.

## Ready-to-paste kickoff prompt

```text
Use the latest phase handoff and continue from the current phase 6 viewer. Start by adding Phase 7 shadows in the simplest stable way, then layer in one ambient motion system that benefits from the new decoration renderer, verify it in the browser, and leave a fresh handoff when done.
```
