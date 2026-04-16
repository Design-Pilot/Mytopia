# Phase 7

## Status

In progress

## Plain-English summary

- The viewer now draws soft ground shadows under visible world objects so the scene has more depth without changing how clicking and hovering work.
- Plant-style decorations can now sway gently using the animation library that was planned for this phase.
- The demo world now includes extra greenery meant to show off that motion, and the demo seed can upgrade older local worlds so the new phase 7 samples appear automatically.
- The page label now reflects the phase 7 milestone instead of the older milestone text.

## What changed in this slice

- Added a dedicated shadow pass between the ground and the main object rendering.
- Kept the shadow approach intentionally simple by using dark ellipses instead of heavy sprite-based shadows.
- Added ambient sway only for tree, bush, shrub, and similar decorative scenery so buildings remain stable and interaction behavior stays predictable.
- Reused the existing decoration renderer instead of building a separate ambient object system for this first phase 7 pass.
- Seeded a tree and extra bushes so the new motion is visible in local demo worlds.

## Decisions to preserve

- Shadows are currently simple, cheap, and static by design. They are meant to be reliable groundwork for later lighting work, not the final shadow system.
- Ambient motion is currently limited to decorative plant life. Buildings and other objects should stay still unless a later phase explicitly changes that.
- The local demo world is allowed to self-repair and self-upgrade across phases, so later phase seeds can safely patch older sample data instead of assuming a brand-new world.

## Verification

- Lint passed.
- Production build passed.
- Convex code generation and sync passed.
- The demo world seed was run manually after the code change and now reports the phase 7 seed as complete.
- A backend check confirmed the new tree and bush demo entities exist.
- A light browser check confirmed the new phase label is being served.

## What was not fully verified

- I was not able to complete a proper visual browser walkthrough with screenshots because the browser automation tools in this desktop session were locked by an already-running browser profile.
- Because of that tooling limitation, the shadows and sway were verified through code, build success, and seeded data state, but not through a fresh automated visual pass.

## Known gaps or risks

- Water shimmer is still not built.
- Road traffic and moving vehicle paths are still not built.
- The shadow system does not yet react to time of day.
- The running development log contains older hot-reload noise from earlier in the session, so the next phase should start with a clean browser refresh before judging console cleanliness.

## Where to look first

- The main scene composition for layer order and camera behavior.
- The object renderer where decorative sway now lives.
- The world seed logic that upgrades local demo content across phases.
- The world-data bootstrap path that decides when demo content needs to be refreshed.

## Suggested starting point for the next phase step

Continue phase 7 by adding one tile-based ambient effect next, with water shimmer being the simplest fit. After that, move on to vehicle path movement only if the browser pass is clean and the ambient layer still feels stable.

## Ready-to-paste kickoff prompt

```text
Use the latest phase handoff and continue phase 7 from the current shadows-and-sway viewer. Start with a clean browser reload, verify the new shadows and plant sway visually, then add water shimmer as the next ambient effect, verify it, and update the handoff before finishing.
```
