# PR Review Fix Checklist

Date: 2026-04-11
Branch: feature/phase-4-tiles-buildings

## Plan

- [x] Tighten bootstrap logic so existing worlds are not auto-seeded unexpectedly.
- [x] Make Phase 4 demo seeding use a reliable completion marker.
- [x] Make demo tile writes safe when tiles already exist at those positions.
- [x] Fix multi-tile entity depth sorting so large buildings layer correctly.
- [x] Guard footprint math against invalid footprint sizes.
- [x] Fix cached sprite loading so placeholders do not get stuck after cache hits.
- [x] Replace the fixed offline timeout with a real bootstrap failure signal.
- [x] Add server-side validation for direct sprite URLs.
- [x] Bound sprite texture cache growth.
- [x] Clean up the contributor note wording to match actual bootstrap behavior.
- [x] Run verification checks.
- [x] Commit and push the fixes.
