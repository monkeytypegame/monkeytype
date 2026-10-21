# 03 — Wire `Words` into test page, delete old renderer

Status: open
Blocked by: 01, 02

## What
See spec "Input / render detachment", "Flush order", "Config / modes".
- Mount `Words` inside `#words` in the test page.
- test-ui hooks (text input, delete, composition update, before/after word change, bad-word / all-correct highlighting, add word incl. zen, restart, clear words, highlight-mode effect) write to the render-state buffer instead of the DOM.
- Register the layout hook: active-element measuring, line jump / tape, words input position, hints update, caret update (caret called from here, not its own frame).
- Delete old rendering: word HTML building, per-word letter rebuilding, pending-word-data map, add-word sync path, per-word debounced frames, `getWordHtml`. `wouldActiveWordOverflow` keeps working off the buffer.
- Hints and node removal are handled in 04/05; they may be broken on the integration branch after this ticket.

## Acceptance
- Existing unit tests pass (update mocks/fixtures that relied on removed internals).
- Seam test: flush calls layout hook after DOM update with the active word element present.
