# Phase

Phase 4 complete, with follow-up review fixes applied and pushed.

## Status

Done

## Plain-English summary

- The viewer now renders tile types and building sprites with a safer, more stable Phase 4 setup.
- The data bootstrap no longer injects demo content into older existing worlds just because a seed flag is missing.
- Demo seeding now uses a proper completion marker and safe tile updates, so it avoids duplicate tile records and partial-seed shortcuts.
- Building layering is more accurate for larger footprints, and sprite loading is more reliable when cached textures are involved.
- The loading experience is less misleading because the offline fallback now depends on real backend failure signals instead of a fixed timeout.
- The recent review issues were fixed, verified with lint and production build, and pushed.

## What changed in this phase

- Finished the Phase 4 viewer work for tiles and buildings.
- Added review-driven hardening around world bootstrap and demo seeding behavior.
- Improved render correctness for multi-tile buildings and invalid footprint edge cases.
- Improved sprite handling with URL validation, safer cache behavior, and a fix for placeholder state getting stuck.
- Reworked the loading fallback so a slow cold start is less likely to be mislabeled as backend outage.
- Added a local checklist note for the review-fix pass and updated the contributor notes to match current behavior.

## Decisions to preserve

- Existing worlds should not be auto-seeded with Phase 4 demo content. Demo seeding is now treated as something that happens when the world is first created, not as a client-side retrofit for older data.
- The demo-seeded marker on the world record is the source of truth. Do not infer completion from a specific tile pattern.
- Tile writes for seeded demo content should stay upsert-like so the rest of the tile API can keep assuming one record per position.
- Entity draw order should continue to use footprint depth, not just the top-left tile, or larger buildings will layer incorrectly.
- The offline fallback should stay tied to actual bootstrap or connection failure signals rather than a fixed elapsed-time guess.
- Direct sprite URLs are allowed, but they should remain server-validated and HTTPS-only.

## Verification

- Build: passed
- Type check: passed as part of the production build
- Browser or end-to-end check: not run in this pass
- Other important verification: lint passed

## Known gaps or risks

- Browser-level visual verification was not rerun after the fixes, so the next phase should still do a quick visual sanity check before building on top.
- The sprite cache now has a simple size cap, but it has not been stress-tested with a large variety of unique remote textures.
- The next phase should avoid re-opening the older bootstrap behavior by treating missing seed flags on legacy data as a migration concern, not a viewer concern.

## Where to look first

- `AGENTS.md` — current project rules, stack notes, and the updated bootstrap summary
- `phases/phase-05-interactions.md` — next implementation target
- `src/components/IsometricGrid.tsx` — current viewer composition, loading states, and the place where interaction UI will likely be coordinated
- `src/components/EntityLayer.tsx` — current entity rendering, footprint-aware sorting, and the place to add building interactivity
- `src/hooks/useWorldData.ts` — current world assembly and bootstrap failure signaling
- `convex/seed.ts` — current world creation and Phase 4 demo seeding rules

## Suggested starting point for the next phase

Start Phase 5 from the existing viewer rather than reworking the data layer. The rendering and bootstrap issues from Phase 4 have already been cleaned up, so the next agent should focus on adding interaction behavior on top of the current entity layer and viewer shell. Begin with hover and click behavior for buildings, then add tooltip state and placement, then finish touch behavior and deselection rules. Keep the current camera behavior intact and be careful not to let hover logic fight with drag-to-pan.

## Ready-to-paste kickoff prompt

```text
Use $phase-handoff. Continue from the latest handoff note instead of re-reading the whole repo. Start with the project instructions, the latest handoff, and the Phase 5 interactions plan. Read only the files named in the handoff unless blocked. First summarize the inherited state, then implement hover, selection, tooltip, and touch interactions on top of the current Phase 4 viewer, verify the result, and update the handoff before finishing.
```
