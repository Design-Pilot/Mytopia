# Plan Creation Checklist

> Follow this checklist every time you start a new phase. This ensures consistency across all phases and prevents common mistakes when vibe-coding.

---

## Before Starting Any Phase

- [ ] Read the project `AGENTS.md` — it has rules that override defaults
- [ ] Read `MASTER-PLAN.md` — understand where this phase fits in the overall project
- [ ] Read the specific phase document in `New Plan/phases/`
- [ ] Check that all prerequisite phases are marked complete
- [ ] Use **context7 MCP** to fetch current docs for any library you'll use (PixiJS, @pixi/react, anime.js, Convex, etc.)
- [ ] Identify the files you'll create or modify
- [ ] Update the phase checklist: mark first task as `[x]` when you begin

---

## While Building

- [ ] Build ONE component or feature at a time
- [ ] After each component: run dev server and verify with Chrome DevTools
- [ ] Check the browser console for errors after each change
- [ ] Take a screenshot via Chrome MCP to verify visual output when applicable
- [ ] Update the phase checklist after completing each task
- [ ] If you hit a blocker, note it in the phase doc under "Blockers / Notes"
- [ ] Keep code simple — future Claude instances need to understand it
- [ ] No `any` types — use proper TypeScript types or `unknown`
- [ ] Use `{ passive: false }` for all wheel event listeners

---

## After Completing a Phase

- [ ] All tasks in the phase checklist are marked `[x]`
- [ ] All acceptance criteria are met
- [ ] No TypeScript errors (run `npx tsc --noEmit` only if user asks)
- [ ] No console errors in Chrome DevTools
- [ ] Update `CLAUDE.md` if new patterns were established
- [ ] Update the phase status in `MASTER-PLAN.md` (add a ✅ next to the phase)
- [ ] Note any learnings or gotchas in the phase doc under "Blockers / Notes"
- [ ] Inform the user what was completed and what's next

---

## Phase Document Template

Every phase document follows this structure:

```markdown
# Phase N: [Name]

## Goal
One sentence describing what this phase delivers.

## Prerequisites
Which phases must be complete before starting.

## Tech Involved
Which libraries/tools this phase uses.

## Detailed Tasks
Numbered step-by-step implementation tasks.

## Testing Steps (Chrome DevTools)
How to verify each deliverable using Chrome DevTools MCP.

## Checklist
[ ] items that get checked off as the AI builds.

## Acceptance Criteria
What "done" looks like — concrete, testable conditions.

## Files to Create / Modify
Explicit file paths for everything this phase touches.

## Blockers / Notes
Updated during development with issues, learnings, and decisions.
```

---

## Context7 Usage Reminders

When using context7 to fetch library docs:

1. Call `resolve-library-id` first with the library name
2. Pick the best match by: exact name, snippet count, source reputation, benchmark score
3. Call `query-docs` with the selected ID and your **full question** (not single words)
4. Use the fetched docs to write code — don't rely on training data for PixiJS 8 or @pixi/react

**Libraries that MUST use context7:**
- `pixi.js` / `@pixi/react` — v8 API changed significantly from v7
- `animejs` — v4 API changed from v3
- `convex` — patterns override training data (also read `convex/_generated/ai/guidelines.md`)
- `@pixi/particle-emitter` — check current API before using

---

## Common Mistakes to Avoid

1. **Don't use React's `onWheel`** — it's passive. Attach wheel listener with `addEventListener("wheel", handler, { passive: false })` in a `useEffect`
2. **Don't import PixiJS at the top level of a server component** — use `"use client"` directive or dynamic import
3. **Don't write full tile grid to Convex** — only store overrides from default tile
4. **Don't skip context7** — PixiJS 8 and anime.js v4 have different APIs than what's in training data
5. **Don't build multiple features before testing** — verify each piece visually before moving on
6. **Don't forget depth sorting** — entities must be Y-sorted (higher gridY = rendered on top)
