# 04 — Hints into component-owned container

Status: done
Blocked by: 03

## What
See spec "DOM structure" (hints container). Indicate-typos `below`/`both`: after flush, the existing imperative hints code builds, positions and joins hints inside each word's `.hints` container (no longer part of word innerHTML). Re-render of letters must not wipe hints incorrectly; hints update on font change and resize as before.

## Acceptance
- Seam test: hints container exists per word and survives letter re-render.
- Hints behaviour matches pre-change in browser (verified in 06).
