# Phase

Phase 5 interaction work is implemented on top of the Phase 4 viewer.

## Status

Mostly done

## Plain-English summary

- Buildings can now react to the pointer instead of behaving like static art.
- Mouse hover shows a brighter, slightly scaled building and opens a tooltip near the cursor.
- Clicking a building toggles a persistent selection marker, and clicking empty map space clears it.
- Touch interaction now behaves differently from mouse interaction: tap a building to show its details, tap it again to dismiss, and tap empty map space to clear the active state.
- Dragging the map now clears hover-style UI so tooltip behavior does not fight with panning.
- The page label now reflects that the viewer is in the interaction phase.

## What changed in this phase

- Added a dedicated interaction state layer for hover, selection, tooltip positioning, and mouse-versus-touch behavior.
- Added a DOM tooltip overlay that stays inside the viewport and shows building details like name, description, tags, and link.
- Updated building rendering so only buildings are interactive, while decorative objects stay non-interactive.
- Added visual feedback for interaction with hover brightening and a gold selection marker under selected buildings.
- Added a background hit area inside the scene so tapping or clicking empty map space can clear active interaction state.
- Exposed drag state from the camera hook so hover and tooltip UI can be suppressed while the user is panning.

## Decisions to preserve

- Interaction state is coordinated in the grid layer, not the page shell. The page stays lightweight and the viewer owns its own behavior.
- Tooltips are regular DOM overlays, not Pixi text. This keeps layout and styling simpler and makes viewport clamping easier.
- Only buildings are interactive right now. Decorations still render, but they do not respond to hover or selection.
- Mouse and touch are intentionally different. Mouse uses hover plus optional selection, while touch uses tap-driven reveal and dismissal.
- Dragging should continue to hide transient hover UI immediately so camera movement feels stable.

## Verification

- Lint: passed
- Production build: passed
- Type checking: passed as part of the production build
- Local backend availability: confirmed
- Browser interaction pass: not completed in this session because the browser automation tools were locked by an already-running profile

## Known gaps or risks

- The interaction logic has not yet had a real browser sanity pass, so cursor behavior, hover feel, and touch dismissal still need a quick manual check.
- The hover effect is intentionally lightweight and stable rather than heavily animated. If the next phase wants more polish, that can be added after behavior is confirmed in-browser.
- Empty-space deselection is handled through a large invisible scene hit area. It should work well for the viewer, but it is worth confirming once in the browser.

## Where to look first

- Project instructions and the latest handoff
- The Phase 5 interaction plan
- The grid viewer where tooltip and selection state are coordinated
- The entity rendering layer where building interactivity and selection visuals now live
- The camera hook where drag state is exposed to the interaction layer

## Suggested starting point for the next phase

Begin with a manual browser sanity check on desktop and a touch-emulation pass in DevTools. Confirm that hover, selection, tooltip placement, empty-space deselection, and drag suppression all feel right. If that passes, the next phase can focus on polish work such as smoother hover animation, richer building detail panels, or the first editable interaction mode.

## Ready-to-paste kickoff prompt

```text
Use $phase-handoff. Continue from the latest handoff note instead of re-reading the whole repo. Start with the project instructions, the latest handoff, and the current interaction plan. Read only the files named in the handoff unless blocked. First run a manual browser sanity check for Phase 5 interactions, then either fix any interaction issues you find or move on to the next viewer polish phase, verify the result, and update the handoff before finishing.
```
