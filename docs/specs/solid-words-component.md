# Spec: Solid `Words` component (PR 1 of the test UI rewrite)

## Problem Statement

The typing test's word display is the largest remaining piece of vanilla DOM code in the frontend. Words and letters are built as HTML strings and rebuilt via `innerHTML` on every keystroke, word/letter state is scattered across DOM classes, and other modules (layout, caret, input handlers) discover state by querying the DOM. This makes the test UI hard to reason about, hard to test, and blocks migrating the remaining test UI pieces (hints, line jump, tape, caret, Tribe) to Solid.

For users nothing should visibly change: typing must feel identical, or faster, and every mode, theme and funbox must render exactly as before.

## Solution

Replace the word/letter rendering in the test UI with a Solid `Words` component driven by a dedicated render-state store. Input handling stays fully detached from rendering: input handlers only write to a plain, non-reactive buffer; a single shared animation frame flushes that buffer into the reactive store, Solid updates the DOM, and then the existing imperative layout code (line jump, tape, words input position, hints, caret) runs against the up-to-date DOM in the same frame.

The rendered DOM keeps its current structure and class names, so themes, funbox CSS and highlight-mode CSS keep working unchanged. Layout, hints, caret and break-joining remain imperative in this PR and are migrated in later PRs.

## User Stories

1. As a typist, I want keystrokes to be processed with no added latency, so that the test feels as responsive as before.
2. As a typist, I want input handling to never wait on rendering, so that fast bursts are never dropped or delayed.
3. As a typist, I want correct letters, incorrect letters and extra letters coloured exactly as before, so that feedback is unchanged.
4. As a typist, I want untyped words to look exactly as before, so that reading ahead is unchanged.
5. As a typist, I want the active word marked exactly as before, so that I always know where I am.
6. As a typist, I want typed words marked as typed, so that typed-effect settings (hide, fade, dots) keep working.
7. As a typist, I want words I got wrong marked with the error style, so that error highlighting keeps working.
8. As a typist using blind mode, I want all letters of a committed word shown as correct, so that blind mode behaves as before.
9. As a typist, I want backspacing into a previous word to work exactly as before, including the restriction on words that scrolled off.
10. As a typist using a hard mode with delete-on-error, I want the same behaviour as before.
11. As a typist, I want line jumps (lines scrolling up) to behave exactly as before, with off-screen lines removed from the display.
12. As a typist using tape mode (word or letter), I want horizontal scrolling and removal of passed words to behave exactly as before.
13. As a typist with "show all lines", I want all lines visible with no jumping, as before.
14. As a typist in zen mode, I want words to appear as I type, the placeholder word to show when empty, and backspace across words to work as before.
15. As a typist in zen mode, I want typed newlines and tabs to display as before.
16. As a typist using text with newlines and tabs, I want the newline and tab glyphs rendered as icons and line breaks to happen in the same places.
17. As a typist using the arrows funbox, I want arrow characters rendered as arrow icons, as before.
18. As a typist using an IME (composition), I want in-progress composition letters shown as dead letters, as before.
19. As a typist with "indicate typos" set to replace, below or both, I want typed characters and hints shown as before.
20. As a typist typing in a right-to-left language or with reversed direction, I want words and caret rendered as before.
21. As a typist using a joining script, I want break-joining behaviour unchanged.
22. As a typist, I want every highlight mode (letter, word, next word, next two/three words) to look exactly as before.
23. As a typist, I want themes that style word and letter states (e.g. rainbow trail, aurora, fire) to keep working unchanged.
24. As a typist, I want funboxes whose CSS targets words and letters (read ahead, choo choo, earthquake, crt, backwards, nausea, etc.) to keep working unchanged.
25. As a typist, I want the caret and pace caret to land on the correct letter in every mode, as before.
26. As a typist, I want the words input to stay positioned at the active word, so that mobile keyboards and IMEs behave as before.
27. As a typist, I want restarting a test to clear the words instantly with no stale letters from the previous test.
28. As a typist, I want words added during the test (endless/timed modes) to appear seamlessly before I reach them.
29. As a typist, I want word overflow protection (input blocked when the active word would wrap) to behave as before.
30. As a typist, I want config changes during a test (font, font size, tape mode, highlight mode, etc.) to re-layout the words as before.
31. As a typist, I want long timed tests to not slow down over time, so that DOM size stays bounded like today.
32. As a developer, I want word/letter display state in one store, so that I can reason about the display without inspecting the DOM.
33. As a developer, I want input-path checks (is a word still rendered) answered from state, not DOM queries, so that the input path stays cheap.
34. As a developer, I want the render flow to happen in a fixed order within one frame, so that layout code always measures fresh DOM.
35. As a developer, I want the word display covered by component tests, so that regressions are caught without manual QA.
36. As a developer, I want the remaining imperative modules (hints, layout, caret, break-joining) to keep working against the component's DOM, so that they can be migrated incrementally.
37. As a developer, I want funbox letter rendering expressed as icon names rather than HTML strings, so that Solid code follows the icon coding standard.
38. As a developer, I want a before/after profiling comparison of per-keystroke cost, so that the change is proven not to regress typing latency.
39. As a future replay/Tribe implementer, I want the event log to remain the source of truth with the render store as a view cache, so that pure `(eventLog) => stat` APIs are unaffected.

## Implementation Decisions

**Scope (PR 1)**
- Solid takes over word and letter rendering only. Line jump, tape scrolling, words-input positioning, hints positioning/joining, caret, pace caret and break-joining stay imperative and operate on the component's DOM.
- No feature flag or parallel old renderer. The old string-building/innerHTML rendering is deleted.

**Render-state module (new)**
- A new module owns the word display state: a reactive store plus a plain non-reactive write buffer.
- Per word, the store holds: display text, typed input, composition data (active word only), and flags `typed`, `error`, `allCorrect` (blind mode).
- Top-level store fields: the word list, `firstRenderedWordIndex` (words below it are not rendered), and `renderedActiveWordIndex`.
- The event log remains the source of truth for input; the store is a view cache. Test words data stays in its existing plain module.
- Write API (called by test-ui hooks and test-logic, never touching reactive state directly): append word, set input (+ composition) for a word, set active word, set word flags, set first rendered index, truncate words (zen), reset.

**Input / render detachment**
- Input handlers and the test-ui hooks they call write only to the plain buffer, synchronously. No reactive state that drives the word DOM is written on the input path.
- A single shared animation frame (not one per word) applies the whole buffer to the store inside a Solid batch.
- The component reads `renderedActiveWordIndex`, never the live active word index signal, so word changes don't cause synchronous DOM work.
- The existing per-word debounced frames, the pending-word-data map and the synchronous special case in add-word are removed; the buffer replaces them.

**Flush order (one frame)**
1. Append new words (including zen words).
2. Update letters of changed words.
3. Update the rendered active index and word flags.
4. Run imperative layout: line jump or tape scroll, words input position, hints, then caret update. The caret is updated from this step rather than scheduling its own frame.

**DOM structure (unchanged)**
- `#words` children stay flat siblings in the current order: each word element followed, if the word contains a newline, by the `beforeNewline`, `newline` and `afterNewline` elements. Rendered via a fragment per word.
- Word elements keep `data-wordindex` and the legacy class names (`active`, `typed`, `error`, letter `correct`, `incorrect`, `extra`, `dead`, `tabChar`, `nlChar`, `invisible`). No Tailwind classes; the result-screen word component is not reused.
- Word elements use per-class toggles (classList), not a full class attribute, so classes and inline styles added imperatively (break-joining, caret RTL/debug classes) survive re-renders.
- Letters render via index-keyed iteration so letter nodes are reused and only changed letters update.
- Each word renders an empty hints container exposed via ref; the existing imperative hints code fills, positions and joins hints inside it.

**Imperative node removal replaced by state**
- Line jump, tape scrolling and zen backspace no longer remove DOM nodes. They raise `firstRenderedWordIndex` or truncate zen words via the render-state API; the rest of their logic (measuring, animating margins, notifying carets) is unchanged. Store writes flush synchronously when made outside the input path, so measurements after them see updated DOM.
- "Is word rendered" checks used by delete and insert handlers read `firstRenderedWordIndex` from state instead of querying the DOM.
- The word-overflow check stays as is (buffer + measurement) for this PR.

**Funbox**
- The funbox word-HTML function is replaced by a letter-icon function returning an icon name or nothing. Only the arrows funbox implements it.
- Tab, newline and funbox icon letters render through the shared `Fa` component.

**Config / modes**
- Highlight-mode changes and blind-mode correctness set store flags instead of mutating word DOM.
- On restart: cancel any pending flush, clear the buffer, reset the store, then render the new words.
- The component lives under the test page components and renders inside `#words`; the test page keeps owning the `#words`, `#wordsWrapper` and `#typingTest` elements and their config-driven classes.

## Testing Decisions

- Good tests assert external behaviour only: given calls to the render-state write API and a flush, the rendered `#words` DOM matches expectations. No assertions on store internals, buffer contents or Solid internals.
- Single seam: mount `Words` in jsdom, stub `requestAnimationFrame`, drive only via the render-state write API, flush, assert DOM. The imperative layout step is mocked; tests assert only that it runs once per flush and after the DOM is updated.
- Covered cases: initial render; letter classes for correct/incorrect/extra/dead (composition); indicate-typos replace; tab/newline/arrow icons; newline sibling elements; active/typed/error/allCorrect flags; nothing rendered before flush; multiple writes coalesce into one flush; `firstRenderedWordIndex` removes earlier words and their newline siblings; zen placeholder, append and truncate; reset clears everything and cancels a pending flush; imperatively added classes survive re-render.
- Input handler tests keep mocking test-ui as today; no new seams there.
- Prior art: component specs under the frontend component tests directory; the words-wrapper-height spec for jsdom work on `#words`.
- Manual QA checklist in the browser: time/words/quote/zen/custom modes, tape off/word/letter, show all lines, RTL and reversed, IME composition, indicate typos (all values), blind mode, all highlight modes, typed effects, arrows/read ahead/other word-styling funboxes, a word-styling theme, restart mid-test, backspace into previous word, line jump, long timed test.
- Profiling: compare per-keystroke cost (input handler time and frame time) before vs after on a long timed test with tape mode on. Regressions block merge.

## Out of Scope

- Migrating hints positioning/joining, line jump, tape scrolling and words-input positioning into the component.
- Migrating caret, pace caret and break-joining onto the component.
- A non-DOM word-overflow check (e.g. text metrics).
- Making test words data or the event log reactive.
- Changing effects that already depend on the live active word index.
- Setting up an e2e/Playwright suite.
- Tribe, replay and result-screen word rendering.

## Further Notes

- Many CSS rules depend on exact sibling structure (`.word.active + .word`, `nth-of-type` in read-ahead funboxes, theme selectors on `.word.typed letter`). Any DOM structure change is a visual regression even if tests pass.
- Later PRs, in order of dependency: hints into the component; line jump/tape as component-owned imperative refs; caret driven from component refs; break-joining via store flags; non-DOM overflow check.
