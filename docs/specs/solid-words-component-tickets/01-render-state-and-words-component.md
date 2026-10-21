# 01 — Render-state store + `Words` component (standalone)

Status: open
Blocked by: –

## What
Build the render-state module and the `Words` Solid component, not yet mounted in the test page. See spec sections "Render-state module", "Input / render detachment", "Flush order", "DOM structure".

- Plain non-reactive write buffer + reactive store; write API: append word, set input (+composition), set active word, set word flags (`typed`/`error`/`allCorrect`), set first rendered index, truncate words, reset.
- Writes never touch reactive state; one shared rAF applies the buffer inside `batch()`, then calls a registered layout hook (step 4). Reset cancels a pending flush.
- `Words` renders flat siblings per word (word element + newline sibling divs when the word contains `\n`), legacy class names, `data-wordindex`, `classList` on word elements, `<Index>` for letters, empty `.hints` container per word, zen placeholder word.
- Letter state derivation ported from test-ui's `updateWordLetters` (correct/incorrect/extra/dead/invisible, indicate-typos replace, zen rules). Tab/newline letters may render as plain placeholders here; icons come in 02.
- Reads `renderedActiveWordIndex` only, never the live active-word signal.

## Acceptance
- Spec "Testing Decisions" cases (except icons and hints filling) covered by jsdom tests at the single seam: mount `Words`, stub rAF, drive via write API, flush, assert DOM.
- Nothing renders before flush; multiple writes → one flush; layout hook runs once, after DOM update.
- Lint/typecheck/format pass (see AGENTS.md).
