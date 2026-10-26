Status: ready-for-agent

# Spec: the frontend's final, fully-Solid state

Reference target for every remaining migration step. Each small conversion PR should move the code toward this picture and away from nothing in it. Step order lives in `roadmap.md` next to this file. Decisions were settled in a grilling session on 2026-10-24 and are summarised under "Settled decisions" at the end.

## Problem Statement

The frontend is most of the way through its move from vanilla imperative DOM code to SolidJS. The shell, routing, every page apart from the test page, all modals, the commandline UI, header, footer and notifications are already Solid. What's left is concentrated and deeply coupled:

- The **typing test**: a handful of imperative "engines" that Solid components hand their elements to (words layout, caret, pace caret, break joining, focus mode, monkey power, funbox document effects, result word highlight, screenshot), all glued together by test-ui, a module that test-logic and the input handlers call directly.
- **Two copies of state** that must stay in sync by hand: a mutable config object next to the config store (and an event bus that fires *before* the store updates, so listeners see stale store values), and a mutable user snapshot that callers mutate and then "set" next to a reactive snapshot mirror.
- **Global event buses** (config, auth, restart test, timer) standing in for state and direct calls.
- Bridges that exist only for legacy callers: `__nonReactive` collection reads, a DOM-wrapper utility library, a "mount the page only once it is attached" workaround, `onDOMReady`.
- **Theming relies on internal markup**: themes, funbox CSS and user custom CSS target ids, class names and a made-up `<letter>` element, so markup can't change without breaking them.

For a developer, this means two ways to do everything. It is unclear which one is canonical, many changes need edits in both worlds, ordering bugs come from the event-before-store hazard, and small conversions are hard to scope because it isn't clear what the end state should be or what blocks what. For a user, it means intermittent bugs at the seams (stale config in listeners, render/measure races, settings lost mid-restart, flashes during restart) and a slower path to features like tribe and replay.

## Solution

One architecture, described below as the final state:

- **One Solid root** renders the whole app. The static HTML holds only what must work without JS/CSS (the no-JS/no-CSS warnings) and the entry script.
- **State has one home per concern**: config in a single store, the user in a single-row user collection, server data in TanStack Query/DB collections, engine state in the engine's own module, UI state in signals/stores under the states area. Changes propagate through reactivity and direct commands, not event buses.
- **The typing test splits into three layers with one-way dependencies**:
  1. a DOM-free **test engine** (lifecycle phases, words, timer, EventLog, stats, funbox plugins) that owns its state and exposes commands and read-only signals,
  2. an **input layer** (the WordsInput component plus handlers) that turns browser input into engine commands and render-store writes, never rendering synchronously,
  3. a **render layer** (TestPage, Words and the components around them) that owns every element it draws, including layout (line jump, tape scroll, break joining), drives both carets, and runs every fade.
- **Imperative DOM work survives only inside the component that owns the element** (measuring, animating, canvas, focus), started from that component's lifecycle. Document-level effects (body classes, head links) each belong to one dedicated component, like Theme and Font do today.
- **Theming targets a stable attribute API**, `data-ui-element` / `data-ui-state` / `data-ui-variant`, which navigation already uses. Ids and classes become internal.

Users should see no behaviour change, except where a bug at today's seams disappears and except intended deviations listed per PR.

## User Stories

### Typists

1. As a typist, I want each keystroke to show up in the next frame, so that typing feels instant no matter how much of the app is reactive.
2. As a typist, I want the caret to move smoothly and land exactly on the next letter, so that I always know where I am.
3. As a typist, I want the pace caret to keep its pace across line jumps and tape scrolls, so that the comparison stays honest.
4. As a typist, I want line jumps to keep my active line at the same height, so that my eyes don't have to chase the text.
5. As a typist using tape mode, I want the tape to scroll smoothly and keep the active word at the margin, so that I can read ahead.
6. As a typist, I want typo hints under my mistakes, merged when they would overlap, so that I can see what I typed.
7. As a typist in an RTL language, I want words, caret and typo hints to follow the word's own direction, so that mixed-direction text renders correctly.
8. As a typist, I want joined-script words (e.g. Arabic) to break and wrap correctly while I type, so that letters stay connected.
9. As a typist, I want focus mode to hide the header, footer and cursor while I type and bring them back when I move the mouse, so that I can concentrate.
10. As a typist, I want the "out of focus" warning to appear the moment the input loses focus, so that I don't type into nothing.
11. As a typist, I want a setting that requires a restart to fade the current test out, apply while it's hidden, and fade the new test in, so that I never see a flash or a double restart.
12. As a typist, I want several setting changes made during one restart to produce a single restart with all of them, so that the test doesn't flicker repeatedly.
13. As a typist, I want toggling a tag mid-test to apply to the current test without restarting it, so that I can tag the run I'm in.
14. As a typist, I want changing font, font size or typed effect to re-lay out the words straight away, so that the caret never sits in the wrong place.
15. As a typist, I want resizing the window to re-lay out words and carets, so that nothing overlaps.
16. As a typist, I want quick restart (tab/enter, esc) to reset words, caret, timer and live stats in one go, so that I can start again with no flicker.
17. As a typist, I want live stats (wpm, accuracy, progress, timer bar) to update every frame, so that I can pace myself.
18. As a typist, I want the keymap to highlight the next key and flash pressed keys, so that I can learn a layout.
19. As a typist, I want IME composition to show inline, so that I can type CJK and other composed scripts.
20. As a typist, I want caps-lock and other warnings to appear without delay, so that I notice before making mistakes.
21. As a typist, I want blind mode to hide my errors by CSS without changing what I typed, so that the result stays accurate.
22. As a typist, I want funboxes (mirror, CRT, nausea, layoutfluid, memory, etc.) to keep working, including their document-wide styling, so that the fun modes stay fun.
23. As a typist, I want monkey power effects to sit at the caret, so that the effect follows my typing.
24. As a typist, I want finishing a test to fade the words out and show my result straight away, with a spinner only if the result isn't ready when the fade ends, so that I never see a needless loader.
25. As a typist, I want my result to appear even while it's still saving, with saving, PB, XP or an error with retry shown as they arrive, so that a slow server doesn't hold up my review.
26. As a typist, I want the result screen to show my stats, chart, words history with burst highlighting, and replay, so that I can review the test.
27. As a typist, I want to hover the result chart and see the matching words highlighted, so that I can find slow spots.
28. As a typist, I want a result screenshot that hides UI noise, so that I can share a clean image.
29. As a typist, I want practice words, quote rating, quote reporting and test sharing to open from the result screen, so that I can act on the result.
30. As a typist, I want sounds on keypress and errors to play in time, so that the feedback matches my typing.
31. As a typist, I want text-to-speech of the active word, so that I can practise by ear.
32. As a typist, I want custom text, quote search and word filters to change the next test straight away, so that I can practise what I want.
33. As a typist on mobile, I want the test config to be reachable and the input to stay in view, so that I can type on a phone.

### Signed-in users

34. As a signed-in user, I want my settings to sync and every open view to reflect a change at once, so that I never see stale settings.
35. As a signed-in user, I want profile edits, name changes, streak offset and Discord linking to update everywhere straight away, so that the app agrees with itself.
36. As a signed-in user, I want my XP, level and streak to update after a test without a reload, so that I see progress.
37. As a signed-in user, I want my activity calendar on account and profile pages, so that I can see my consistency.
38. As a signed-in user, I want quote ratings stored and shown consistently, so that my ratings don't vanish.
39. As a signed-in user, I want the tags active at the moment I finish to be saved with the result, so that my stats are grouped correctly.
40. As a signed-in user, I want tags, presets and filters to apply without a reload, so that my workflow stays smooth.
41. As a signed-in user, I want signing out to clear user data everywhere, so that nobody else sees it.

### Theme and custom CSS authors

42. As a theme author, I want to target stable `data-ui-element` / `data-ui-state` / `data-ui-variant` attributes, so that markup refactors don't break my theme.
43. As a theme author, I want every themeable part of the test (words, word, letter, caret, pace caret, typo hint, live stats, result parts) to carry a `data-ui-element`, so that I can style all of it.
44. As a theme author, I want letter and word states (correct, incorrect, extra, typed…), the active word and the words modes (blind, highlight, flipped…) exposed as `data-ui-*` attributes, so that I don't depend on internal class names.
45. As a user with custom CSS, I want old selectors to keep working until a single announced removal, so that I have time to move my CSS over.
46. As a funbox CSS author, I want funbox styling to keep a stable hook (body-level funbox state and the funbox stylesheet), so that funbox styles apply.

### Multiplayer (tribe) (WIP) 

47. As a tribe player, I want to join rooms, chat, ready up and race with other players' carets on my words, so that I can race friends.
48. As a tribe player, I want tribe result bars and standings next to my result, so that I can compare.

### Developers and agents

49. As a developer, I want one canonical way to read and write config, so that I don't have to sync two copies.
50. As a developer, I want config reactions to be effects on the config store, so that I never read stale values in a listener.
51. As a developer, I want test restarts to be triggered by the config metadata's restart flag, so that callers don't have to remember to restart.
52. As a developer, I want the user to be one single-row collection with named mutations and one read function, so that there is a single copy, updates are tracked and nothing is mutated in place.
53. As a developer, I want server data to come only from queries and collections, and small collections to have one getter that is reactive in components and synchronous elsewhere, so that caching and reads are uniform.
54. As a developer, I want the test engine to have no DOM access and own its state, so that I can test it headless and feed it to replay.
55. As a developer, I want the EventLog to stay the source of truth for stats, with pure stat functions of an EventLog, so that replay can recompute every stat.
56. As a developer, I want `finish()` to be a cheap synchronous transition, so that nothing can race a half-finished finish.
57. As a developer, I want input handlers to write only to the engine and the render buffer, so that input never triggers synchronous rendering.
58. As a developer, I want each element on screen to belong to exactly one component, so that I know where to change it.
59. As a developer, I want Words to be the only thing that drives layout and the carets, so that all measuring happens in one place after one flush.
60. As a developer, I want document-level effects (body classes, head links, global listeners) in dedicated components, so that they're mounted, cleaned up and visible in the tree.
61. As a developer, I want no global event buses, so that data flow is traceable through imports and signals.
62. As a developer, I want the DOM-wrapper utility library and `onDOMReady` gone, so that new code can't reach for them.
63. As a developer, I want lint rules that enforce each layer's boundary as soon as it's clean, so that the codebase doesn't regress.
64. As a developer, I want commandline entries generated from one config metadata source, so that adding a setting needs one edit.
65. As a developer, I want pages to mount like any Solid component, so that the "wait until attached" workaround can go.
66. As a developer, I want all component styling in Tailwind, so that there's one styling system.
67. As a developer, I want each migration step to be small and independently mergeable, with intended behaviour changes listed and recorded, so that review stays easy and nobody re-flags them.
68. As an agent, I want a spec and roadmap naming the target shape and order, so that I can pick up one step without re-deriving the plan.
69. As a developer, I want the test page to be testable through one harness (render, type, flush frames, assert), so that refactors are safe.
70. As a developer, I want dead legacy modules deleted, so that search results only show live code.

## Implementation Decisions

### App shell

- One Solid render root. Boot work that today waits on DOM-ready (body transition, app-ready flag, server-configuration sync, merch banner, service worker) moves into the App component's lifecycle or a DOM-free boot module. `onDOMReady` and the ready module are deleted.
- The static HTML keeps only: the theme fallback variables and CSS layer order, the no-JS/no-CSS warnings (they must render without JS/CSS), the funbox stylesheet link hook, the captcha script and the entry. Showing or hiding the warnings is done by state (no-CSS detection, screenshot mode), not by DOM queries scattered across modules.
- The page wrapper stops delaying content mount until the element is attached, once nothing measures on mount outside a component's own ref lifecycle.
- Routing stays on the TanStack Solid Router (route tree, guards, loaders, loading steps, blocking vs background data as in the glossary). Vanilla modules that need to navigate use the router instance handle; that bridge may remain.

### State

- **Config**: the config store is the only copy. The setter validates, writes the store, persists, then anything else. The mutable config object, its event bus and the full-config-change start/finish events are deleted. Reactions are effects on the specific keys they care about. Non-tracking reads in plain functions (engine, commandline actions) read the store directly. Batch-applying a whole config (preset, import, sign-in) is one batched store reconcile, so effects run once.
  - Interim rule until the event bus is gone: the store must be updated *before* the event fires, so listeners never see stale values.
- **Config metadata** is the single source for settings UI, commandline generation, validation and restart behaviour (`changeRequiresRestart`). The separate commandline-metadata module is merged into it. Commandline icons use the icon component's types, not strings.
- **User**: a single-row TanStack DB collection keyed by uid replaces both the mutable user snapshot and its reactive mirror (and the planned snapshot store).
  - It's a query collection on the existing cached user response (as tags already are); the mapping from the API shape lives in its `queryFn`. `enabled` while signed in, `staleTime`/`gcTime: Infinity`.
  - The row holds what the snapshot holds today. Test activity is plain data (days and last day); the calendar class and per-year cache live in the calendar component. Tags, presets etc. stay in their own collections; the last-result signal stays a signal.
  - Signed out means no row; consumers handle "no user". No default user stands in. A failed user fetch shows the error and leaves no row (today it silently falls back to defaults). Sign-in waits for the row inside the blocking user-data step, as it does for tags and presets.
  - **Reads**: one `getUser()`, backed by a module-level reactive mirror of the row: reactive inside components and effects, a plain synchronous read elsewhere (engine at finish, plain modules). No separate hook, no `__nonReactive`, no direct collection access outside the module.
  - **Writes**: named functions only; the raw update stays private. Mirrors of what the server already did (xp, streak, typing stats, PBs, leaderboard memory, badges, inbox count) are direct writes with no API call or refetch. User-initiated changes (name, Discord unlink, streak offset, quote ratings, favourite quotes) are optimistic actions that call the API and roll back on failure, as custom themes and connections do. Server-owned flags (banned, verified, leaderboard opt-out) have no setters.
  - The auth bus's snapshot-updated event goes away; consumers read `getUser()`.
- **Auth**: auth state is a signal (unknown, signed in, signed out), which the router's auth context and UI read. The user-data load sits next to it as state (loading, loaded, failed with an error) plus a `reloadUserData()` command; the router's auth context reads it for the blocking user-data step (user row, tags, presets) and its retry, instead of receiving a promise through an event. The auth bus (both its auth-state-changed and snapshot-updated events) is deleted.
- **Server data**: Query for read-only server data, DB collections for user-owned lists (results, tags, presets, connections, ape keys, inbox, custom themes, filter presets) and the single-row user collection above.
  - Small collections (tags, presets, custom themes) use the same read pattern as the user: each module exports plain getters (eg. `getTags()`, `getActiveTags()`) backed by a module-level reactive mirror, reactive in components and synchronous elsewhere. They replace both `__nonReactive` and the separate live-query hooks for these collections, are documented as "returns only what's loaded, never fetches", and keep `gcTime: Infinity`.
  - `__nonReactive` exists only for old-style code. It is not replaced one-for-one: each caller is rewritten as Solid code (or moved into the engine) as part of its own step, and `__nonReactive` is deleted once the last caller is gone. Reading a getter outside a tracking scope, as the engine does at finish, is ordinary Solid usage, not an escape hatch. Sign-in already waits for tags and presets inside the blocking user-data step, so they're loaded before any test can start; no extra blocking data is added.
  - Large reads (all results) use the async `*Once` form and stay off hot paths.
- **UI state**: module-level signals and stores grouped by feature in the states area, created with the existing helpers. No plain `let` state that UI reads. Engine state is not here (see below).

### Typing test: engine

- **DOM-free and self-owned**: the engine owns its state in its own module (phase, active word index, words, timer, live stats, current result, save status) and exports read-only signals plus commands. Only the engine changes engine state. The general test state module keeps only UI state (focus, hidden flags, input position), and its `__nonReactive` escape hatch goes away.
- **Phases**: idle → active → finished/failed, plus restarting. Commands: start, restart, finish, fail, retry save, plus word navigation. The restart-test and timer buses are replaced by these commands and by the timer living inside the engine.
- **Restarts driven by the config flag**:
  - The config store updates immediately, so the UI showing the setting reflects it at once.
  - The engine reacts to changes on keys flagged `changeRequiresRestart` by requesting **one** restart. Several changes during the same restart merge into it; callers no longer trigger restarts themselves.
  - Everything that renders the test reads the **test settings** (the settings the test was generated with, held by the engine), not live config. The old test stays as it was while it fades out; the test settings are retaken and words regenerated while the test is hidden; then it fades in. A change during an in-progress fade-out only updates the pending state: no second fade, no double restart.
  - Off the test page, there's no fade: the next visit generates with the current config.
  - Tags are not test settings: they're live. Toggling a tag mid-test applies to the current test and keeps it running.
- **Finish**:
  - `finish()` / `fail()` are cheap synchronous transitions: stop the timer, set the phase, freeze the EventLog. The result signal starts empty ("calculating").
  - The engine then computes the result after giving the browser one paint (so the fade can start), and publishes it. It reads the **current** active tags through the collection's synchronous getter at that point.
  - Saving is a separate async process the engine starts but doesn't await, exposed as a save-status signal (saving, saved with PB/XP response, failed) with retry as a command.
  - PB comparison and the today tracker run after finish (result screen or async), not inside engine finish.
  - Profile a worst-case (very long) test before considering anything heavier, like a worker.
- **Stats** stay pure functions of an EventLog. Live hot paths may add running tallies next to them, never replace them (the replay constraint). Each tally has a parity test: for a typed event sequence, tally equals the pure function on the built log.
- **EventLog**: engine state like the rest.
  - The engine owns the event arrays and pressed keys; `logTestEvent` is an engine command input calls. Translating browser events into event codes (key code mapping, which keys are tracked) is input-layer code.
  - The raw arrays stay plain, not reactive (a write per keypress). The engine exposes derived signals: current input, live stats, and the frozen log, which is the result's input and replaces the test state module's last-event-log signal.
  - The log is the engine's truth for typed input. The render layer never reads it; it gets typed input from the render store, which input writes alongside the log.
  - Context: setting-derived fields (mode, mode2, custom text limit, nospace funbox) come from the test settings, never live config; target words and Korean status from the engine's words (Korean status stays one test-level boolean derived from the words, unless stats turn out to need it per word); bailed out is read at freeze.
  - Lifetime: on finish/fail, pressed keys are force-released (estimated keyups), then the log freezes and later events are dropped. A restart resets the live log at once; the frozen log stays until the next finish.
  - Bump the EventLog version only when its shape changes, not when a field's source moves.
- **Per-word facts** fixed for a test (direction, has numbers/newlines/tabs, Korean status) are computed once at generation and carried on the word; this redoes the idea of open PR #7787 on top of the render store.
- **Pace-caret timing** (where the pace caret should be at time t, as a word/letter target) lives in the engine, DOM-free.
- **Funboxes are engine plugins**: pure hooks for word generation and transforms, timing and input rules, with no DOM access. Hooks get the input they need (current input, input for a word) as arguments; they never import the EventLog. Document-wide effects belong to the Funbox component; display tweaks are `data-ui-*` state or the funbox's CSS.

### Typing test: input layer

- The WordsInput component owns the hidden input element, its listeners, its position and autofocus. Handlers call engine commands and write the words render buffer.
- Input never renders or measures synchronously, with **one documented exception**: the overflow check deciding whether a typed word would leave the line, a synchronous measurement exported by Words. Keep it unless a clearly better approach turns up.
- Global hotkeys stay a declarative hotkey registry.

### Typing test: render layer

- The words render store, fed by the shared per-frame flush buffer, is the only input to Words, Word, WordLetter and TypoHints, including the typed input that layout and the caret position from.
- **Words owns all layout**: after each flush it runs one layout pass: break joining, line jump, tape scroll, input positioning and caret updates. Break-joining state becomes a reactive class/style on Word. The word-element registry becomes private to Words; only the overflow check is exported.
- **Words keeps the active line in view** as part of that layout pass: during a test, when the words wrapper is taller than the window, it scrolls the window to the active word (down only while typing, both ways when recentering after a re-layout or on request). The focus flow asks for a recenter through a request signal. Before the test, TestPage keeps the test block in view.
- **Carets: boundary fixed, internals decided during the caret rewrite.** Words is the only thing that drives the caret and pace caret; nothing outside Words calls them; the line-jump/tape-scroll handoff is internal to Words. Whether a caret animates through fully reactive props, imperative calls on a private handle, or a mix is decided during that step, based on what gets the movement looking right. Tribe carets follow whatever is chosen.
- **TestPage runs all fades**, driven by the engine's phase: words fade out on finish; when the fade-out completes, the result fades in if the result signal has a value, otherwise a spinner fades in and is swapped for the result when it arrives. Restart fades follow the restart flow above.
- **test-ui is deleted.** Sound, keymap highlight and monkey-power triggers become effects on engine/input signals or direct calls from the input layer.
- **Focus mode**: a signal. The root layout binds focus state on the app, header, footer and banners; cursor hiding is CSS keyed off that state. One component owns the mouse-move exit listener.
- **Funbox component** owns funbox document state (body funbox state, the funbox stylesheet link, CRT scanline), derived from active funboxes.
- **Monkey power**: a component owning its canvas, positioned from the caret.
- **Result**: fully component-driven. Word highlight on chart hover is part of the words-history component, driven by a highlighted-range signal the chart writes.
- **Screenshot**: a screenshot-mode signal. Elements that hide during capture do it through state; the capture reads the result element through its ref.
- Visibility rules (blind mode, hidden letters, out-of-focus blur) are CSS on `data-ui-*` state, not JS.

### Theming and styling

- **Theme-facing API**: `data-ui-element` (identity), `data-ui-state` (one value from the component's status type, eg. a letter's `LetterStatus`, a word's `WordStatus`) and `data-ui-variant` (space-separated where several apply, matched with `~=`, eg. the words modes `highlight-word blind flipped colorful joiningScript`). Facts independent of the state get their own attribute: `data-ui-active` on the active word, `data-ui-corrections` (`corrected`, `extraCorrected`) on result letters. The result words containers are `wordsHistory` and `replayWords`; their words and letters share the `word`/`letter` names. Navigation already uses `data-ui-element`/`data-ui-variant`, and some themes already target it. Every themeable component gets them, including the test page: words, word, letter, caret, pace caret, typo hint, live stats, result parts. Ids and classes are internal and can change freely.
- **`<letter>` goes away**: letters render as `<span data-ui-element="letter" data-ui-state="…">` (inline by default, so no extra CSS). Any other made-up elements (`<hint>`) get the same treatment. The attributes come first (T1), on the old tags with their classes, so legacy selectors keep working; the tags become spans in CL3, the single announced break. Code finds letters by `LETTER_SELECTOR`, never the tag.
- **Migration of themes**: each conversion PR adds the attributes and moves the bundled themes and funbox CSS over. Old ids/classes/`letter` selectors keep working until one announced removal step at the end, which is the single break for user custom CSS.
- **Styling**: all component styling is Tailwind through the class-merge helper. SCSS remains only for keyframes and base styles that must target `data-ui-*` (eg. letter colours from theme variables, blind mode); the test, caret and letter SCSS is rewritten against `data-ui-*` and the SCSS files are deleted by the end.

### Leaf UI and utilities

- No module outside a component queries the document for elements. Components use refs (callback ref pattern, act in `onMount`), per the coding standards.
- The DOM-wrapper utility library (`qs`/`qsa`/element-with-utils), the ref-with-utils hook and `onDOMReady` are deleted at the end.
- Server-provided HTML (notifications, simple modal, version history, quote-search highlight) keeps using `innerHTML`, sanitized, as the lint rule's allowlist.
- The activity calendar is a Solid component over plain activity data. The sorted table utility is replaced by the DataTable component. Ad and analytics controllers keep their third-party script handling but find elements through component refs or state.
- Dead modules are deleted (result batches, character counter, discord avatar util, input indicator, the unused parts of input validation, tag builder).

### Dependency rules and enforcement

- Engine imports no UI, no input module and no DOM. It **may** import the data layer (collections, states, config).
- Input imports the engine and the render buffer, never components.
- Components import states, the engine's signals/commands and hooks. A component never calls back into input.
- Only components (and their private helper modules) touch the DOM.
- Each rule becomes a lint rule (import restrictions per folder, plus a ban on document queries and `innerHTML` outside the allowlist) **in the PR that makes that layer clean**: the engine rule with the engine split, the input rule with test-ui's deletion, the DOM-query ban at the end.

### Tribe

- Tribe lands only after everything else is Solid. It's re-ported from the `newtribemerge` branch onto the final architecture, keeping the decisions already taken: tribe state in the states area (room store, client signals), a single tribe route with sub-views derived from client state plus an auto-join route, tribe carets built like the normal caret, result parts outside the per-result-remounting result component.

### Behaviour changes in conversion PRs

- A conversion PR may include intended behaviour changes if they're listed in its description and recorded under "Intended deviations" below, so reviewers and agents don't flag them as regressions. Bug fixes found along the way may ride along on the same terms.

## Testing Decisions

Good tests check behaviour through the highest available seam: render, act like a user, assert what's on screen or in public state. They don't check internal call order, mocks of sibling modules or private helpers. Layout and measurement can't be checked in jsdom; those claims are verified in the browser with the `__mt` debug handle (`checkLayout`, `runCommand`, `setConfig`) per the agent browser doc.

Seams, highest first:

1. **App-shell harness** (existing): renders the real route tree with fake auth, a test query client and controllable data. Used for routing, guards, loading steps and page lifecycle. Prior art: the app-shell routing spec and the loading-page timing spec.
2. **Test-page harness** (`frontend/__tests__/__harness__/test-page.tsx`, usage in its header; the main seam for the test): mounts the *real* TestPage with the real engine, types through WordsInput (input/beforeinput/keydown/composition), advances frames, and checks rendered words/letters (via `data-ui-*`), engine phase, live stats, the finish → result/spinner flow and the restart flow. Built early on the critical path, before the risky steps; every later test-page step keeps it green. Prior art: the render-words harness and the Words, WordsInput and TypoHints specs.
3. **Engine, headless**: commands in, signals out: restart merging and test settings, finish/fail transitions, calculating → result, save status, tags read at finish. No DOM.
4. **Pure modules** (existing pattern): letters/display rules, typo-hint merging, keymap converter, stats as functions of an EventLog, word generation, config setter validation, config metadata. Prior art: the letters/typo-hints specs, the config and config-metadata specs, the stats specs.
5. **Store/state modules**: user collection mutations and `getUser()`, config store apply/reconcile, words-render buffer flush. Assert through their public getters.

Also test as they change: funbox document effects (state and links on mount/unmount), the activity calendar component. Profile: letter rendering with attribute states, and finish on a worst-case long test.

## Out of Scope

- Backend, contracts and API changes (collections keep the current API shapes).
- Visual redesigns, and behaviour changes beyond seam-bug fixes and listed deviations.
- The replay system itself; only the constraint that the EventLog stays the source of truth and the engine runs headless.
- Replacing animejs, TanStack, Tailwind or the router.
- New tribe features beyond porting the existing branch.
- Converting server-rendered HTML (notifications, version history) into components.
- Static content pages outside the app (privacy, terms, security, email handler, 404 html).
- An issue-tracker setup: this spec and roadmap are the reference.

## Intended deviations

Recorded per track as conversion PRs land. Already accepted from the Words rewrite:

- Typed arrows (extra / replaced typo / zen) and icon characters in IME composition render as icons.
- Blind mode is CSS-only; letters keep their true status.
- Typo hints persist across flushes, so the theme's animation plays only on new or changed hints; merge direction comes from the hint's own word.
- A replaced typo on a tab/newline isn't faded; a typed tab/newline is.

From config (C1):

- Config event listeners read the new value from the store, not the stale one.
- A key that fails to apply during a whole-config apply holds its default in the store (it used to hold the rejected value).
- A single setting change runs store effects before config event listeners. A whole-config apply runs them once, before failed keys are re-saved and before full-config-change finished (they used to run after it).

## Settled decisions (grilling, 2026-10-24)

| # | Decision |
|---|---|
| Q1 | DOM-free test engine is part of the final state |
| Q2 | Deferred: caret internals decided during the caret rewrite; only the boundary is fixed |
| Q3 | Single config store; mutable config and config bus deleted |
| Q4 | No global event buses; `createEvent` only for local use |
| Q5 | Superseded by Q22: the user is a single-row collection, not a store |
| Q6a–c | `data-ui-element`/`-state`/`-variant` is the theme API; bundled CSS moved over per PR; legacy selectors removed in one announced step |
| Q7 | Test-page harness is the main test seam |
| Q8 | Tribe lands after everything else is Solid |
| Q9 | Spec and roadmap live in `docs/specs/solid-monkeytype/`, committed; no tracker |
| Q10 | `<letter>` becomes `<span data-ui-element="letter">`, in CL3; T1 adds the attributes to the old tag |
| Q11 | Engine owns its state module |
| Q12 | All styling to Tailwind; SCSS only for keyframes and `data-ui-*` base styles |
| Q14 | Lint rules land when each layer is clean |
| Q15 | Keep the one synchronous overflow check unless something clearly better appears |
| Q16 | Restarts driven by `changeRequiresRestart` (restart-required settings); test settings; apply while faded out; one merged restart |
| Q17 | Synchronous in-memory getters for small collections; active tags read at finish (tags are live); large reads async |
| Q17b | Cheap synchronous `finish()`; result computed after a paint; spinner only if not ready when the fade-out ends; saving as separate state |
| Q18 | Listed, recorded behaviour changes allowed in conversion PRs |
| Q19 | Funboxes are DOM-free engine plugins plus one Funbox component |
| Q20 | Critical-path order as in the roadmap |
| Q21 | Server-provided HTML stays as a sanitized `innerHTML` allowlist |
| Q22 | Single-row user collection replaces the mutable snapshot and its mirror; row = today's snapshot; test activity plain data; tags etc. stay separate |
| Q23 | Query collection on the cached user response; signed out = no row (no default user); fetch failure = error, no row; sign-in waits for the row |
| Q24 | Named write functions only: direct writes for server-side effects, optimistic actions for user changes; no setters for server-owned flags |
| Q25 | U1 adds the collection and converts all writers; a read-only `DB.getSnapshot()` shim stays until readers move, then is deleted |
| Q26 | Quote ratings stay in the user row as an optimistic action; #7717 closed |
| Q27 | One `getUser()` read: reactive in components, synchronous elsewhere |
| Q28 | Same one-getter pattern for tags, presets and custom themes (replaces their live-query hooks); results stay async. `__nonReactive` goes by rewriting its old-style callers, then deleting it |
| Q29 | Auth bus deleted entirely; the user-data load is state (loading/loaded/failed) plus `reloadUserData()` beside the auth signal, read by the router |

EventLog (grilling, 2026-10-26):

| # | Decision |
|---|---|
| E1 | Engine owns the log, pressed keys and `logTestEvent` (a command); key-code helpers move to input |
| E2 | Raw event arrays stay plain; engine exposes derived signals (current input, live stats, frozen log); frozen log replaces `lastEventLog` in the test state module |
| E3 | Log is the engine's input truth; input also writes typed input to the render buffer; render reads only the render store |
| E4 | Context: setting-derived fields from test settings, words/Korean status from engine words, bailed out at freeze |
| E5 | Every live tally gets a parity test against its pure function; hot paths move to tallies only if profiling demands |
| E6 | Funbox hooks receive input as arguments |
| E7 | Freeze after force-releasing keys, later events dropped; restart resets the live log, frozen log lives until the next finish |
| E8 | Version bump only on shape change |
| E9 | Roadmap: T6a ownership, T6b context, T6c freeze, T3 render reads input from render store, L2 funbox hook args, EP4 parity tests |
| E10 | Korean status stays a test-level boolean in the context after EP3, unless stats need it per word (then per word plus a version bump) |

## Further Notes

- Current state (2026-10-24, master @ 34efffaa6): all pages, modals, commandline UI, layout and routing are Solid. About 68 DOM-wrapper query calls remain across 23 files, mostly in the test. The mutable config has about 539 references in 58 files; there are 11 config-bus subscribers; about 37 files import the user snapshot modules. 52 bundled themes target `#words`, `.word`, `letter`, `#caret` and similar.
- Open PRs: #8507 (Words owns its layout) is current and is the first step on the critical path. #8031 is superseded by master and can be closed. #7373 (snapshot store) and #7717 (quote-rating collection) are superseded by the single-row user collection and can be closed. #7787 (word direction) should be redone on the render store. #8490 (app-shell test speed-up) is low-risk and helps the harness seam.
- The `newtribemerge` branch (about 14k lines) depends on deleted modules (old router, page controller, mount).
- Related memory/decisions: input detached from render (buffer plus shared rAF flush), event-log replay constraint, Words letter display deviations, tribe migration decisions.
- Glossary terms used: page, test page, page fade, loading page/bar/step, blocking vs background data, typo hint, merged typo hint, line jump, tape mode, tape scroll. Added to the glossary: **test mode**, **funbox**, **finish**, **fail**, **result**, **active tags**, **pace caret**, **focus mode**, **test settings**, **restart-required setting**, **theme attributes**. Test engine, render store and layout pass are code-structure terms defined in this spec, not glossary terms.
