# 05 — Node removal → state

Status: open
Blocked by: 03

## What
See spec "Imperative node removal replaced by state".
- Line jump and tape scrolling raise `firstRenderedWordIndex` instead of removing children (incl. newline siblings); remaining measuring/animation/caret notification unchanged.
- Zen backspace across words truncates zen words via the API.
- `isWordRendered` reads `firstRenderedWordIndex` (used by delete and insert-text handlers).
- Update `words-wrapper-height.spec` if it relies on removed behaviour.

## Acceptance
- Seam tests: raising first rendered index removes earlier words and their newline siblings; zen truncate.
- Handler tests still pass.
