Status: ready-for-agent

# Roadmap: getting to the fully-Solid frontend

Companion to `spec.md`. Every step is one small change, behaviour-preserving apart from listed and recorded deviations. IDs are stable so steps can reference them (`Blocked by: T3`).

**Size** column: S is one area, low risk, under ~150 lines; M is several files or a visible behaviour change; L is cross-cutting or touches the typing loop. **commit** goes straight to master (tests, lint and a browser check still apply); **PR** gets a review first: anything that changes what users see, the typing loop, theme selectors or the data layer.

## Step by step

Each step can start once the previous step's **bold** items are done. Everything listed on one step can run in parallel.

- [ ] 1. **H1–H5** housekeeping, then start all at once: **T0** (merge #8507), **C1**, **EP1**, **EP2**, **L1**, **L2**, plus any of U1, U5, C5, EP4, L4–L11.
- [ ] 2. **TH1** test-page harness, then **T1** letter → span + `data-ui-*`. Alongside: U2, U3, U4 (after U1), C2, C3.
- [ ] 3. **T2** break joining. Alongside: EP3.
- [ ] 4. **T3** caret boundary. Then L3 and L12 can start.
- [ ] 5. **T4** word registry private.
- [ ] 6. **T5** delete test-ui (needs EP1, EP2, L1, L2 from step 1).
- [ ] 7. **T6a** engine state → **T6b** restart via flag and **T6c** finish split (these two in parallel).
- [ ] 8. **T7** drop the page-mount workaround (needs L3, L4, L5). Alongside: C4, U6.
- [ ] 9. **CL1–CL4** final cleanup, including the announced removal of legacy theme selectors.
- [ ] 10. **TR1** tribe.

## The shape

```
 T: test page (CRITICAL PATH, serial)
   T0 #8507 ─► T1 letter→span + data-ui-* ─► T2 break-joining ─► T3 caret boundary ─► T4 registry private ─► T5 delete test-ui ─► T6 engine split (T6a–c) ─► T7 drop page-mount workaround
   TH1 test-page harness (after T0, before T1)            ▲ needs EP1, EP2, L1, L2           ▲ needs L3, L4, L5
                                                          │
 C: config            C1 ─► C2×5, C3 areas (parallel) ──────────────────────────► C4 delete Config + configEvent (needs T6)
 U: user data         U1 ─► U2, U3, U4 (parallel);  U5 anytime ─────────────────► U6 delete __nonReactive (needs T6a, T6c)
 EP: engine prep      EP1, EP2 (parallel, before T5);  EP3 after T1;  EP4 anytime
 L: leaves            L1 L2 before T5;  L3 after T3;  L12 after T1+T3;  L4–L11 anytime
 CL: final cleanup (needs everything)  ─►  TR: tribe (after CL)
```

Tracks that can run **at the same time**: T (one person, serial), C, U, EP and L. Collisions to watch: T6 and EP both touch test-logic; C3 "test modules" and T3 both touch the caret; T1 and L11 both touch test SCSS.

### Cross-track dependencies

Every track can start now. These are the only steps that wait on another track:

| Step | Waits on | Why |
|---|---|---|
| **TH1** test-page harness | T0 | Builds on Words owning its layout |
| **T2** break joining | TH1 | The harness is the safety net from here on |
| **T5** delete test-ui | EP1, EP2, L1, L2 | test-ui still calls the timer event, focus and funbox; they need new homes first |
| **T6b** restart via flag | C1 | Restart reacts to config changes, so the store must update before the event fires |
| **T7** drop the page-mount workaround | L3, L4, L5 | Monkey power, result highlight and screenshot measure or query on mount today |
| **C4** delete `Config` + `configEvent` | T6, L2 | test-logic and pace caret are the last subscribers (L2 removed funbox's) |
| **U6** delete `__nonReactive` | T6a, T6c | Its last callers (layout emulator, keydown, test-logic, result PB, today tracker) are rewritten there |
| **EP3** per-word facts | T1 | Builds on the new letter/word rendering |
| **L3** monkey power | T3 | Needs the caret boundary for the caret position |
| **L11** SCSS → Tailwind (test-activity styles only) | U2 | The activity calendar is rewritten there |
| **L12** test/caret SCSS | T1, T3 | Rewrites styles for elements those steps change |
| **CL1** delete the DOM-wrapper library | T7, all L, U2 | Its last users go away there |
| **CL3** remove legacy theme selectors | T1, L11, L12 | Bundled themes must be moved over first |
| **TR1** tribe | CL | Lands after everything else |

Fully independent from start to finish: H, U1–U5, C1–C3, C5, EP1, EP2, EP4, L1, L2, L4–L10.

## Track H: housekeeping (now, minutes)

| Done | ID | Size | Step | Blocked by | Notes |
|---|---|---|---|---|---|
| [ ] | H1 | XS · merge | Merge **#8490** (app-shell test speed-up) | none | Faster harness for every later step; merge before TH1 if TH1 extends the app-shell harness |
| [ ] | H2 | XS · close | Close **#8031** | none | Superseded by master's PractiseWordsModal |
| [ ] | H3 | XS · close | Close **#7373** and **#7717** | none | Superseded by the single-row user collection (U1) |
| [ ] | H4 | XS · comment | Comment on **#7787** | none | To be redone as EP3 on top of the render store |
| [x] | H5 | S · commit | Add glossary terms: test settings, restart-required setting, theme attributes, test mode, funbox, finish, fail, result, active tags, pace caret, focus mode | none | Test engine, render store and layout pass are code structure: defined in the spec, not the glossary |

## Track TH: test-page harness

| Done | ID | Size | Step | Blocked by | Unblocks |
|---|---|---|---|---|---|
| [x] | TH1 | L · PR | **Test-page harness** (`__tests__/__harness__/test-page.tsx`, own `test-page` vitest project): mounts the real TestPage and engine in jsdom on fake timers, types through WordsInput (input/beforeinput/keydown/composition, the driver `__mt` uses), advances frames, and reads word/letter states (semantic names, not classes), engine phase and live stats. Starter suite in `TestPage.page-spec.tsx`; specs on it are named `*.page-spec.tsx`. Grows with the engine: restart flow after T6b, finish → result/spinner after T6c | T0 | T2 onward: every later test-page step keeps it green |

## Track T: test page (critical path)

Serial; each step needs the previous one. Verify each in the browser (`__mt.checkLayout`) and with the test-page harness once TH1 exists.

| Done | ID | Size | Step | Blocked by | Removes / unblocks |
|---|---|---|---|---|---|
| [ ] | T0 | M · PR #8507 | Merge **#8507**: Words triggers its own layout (flush subscription, config/font/resize effects) | none | test-ui's layout calls |
| [ ] | T1 | L · PR | **`<letter>` → `<span data-ui-element="letter" data-ui-state>`**, plus `data-ui-element` on words/word/typo hints; move the bundled theme and funbox CSS to the new selectors; old selectors keep working. `data-ui-state` values are the harness's state names; switch its word/letter helpers to `data-ui-*`, specs unchanged. Benchmark letter rendering with the profiling harness | T0, TH1 | The made-up element; proves the theme attribute approach before the caret measures letters |
| [ ] | T2 | M · PR | **Break joining** computed in the layout pass, rendered as reactive class/style on Word; delete the break-joining module's DOM writes | T1, TH1 | The only outside writes into Word elements |
| [ ] | T3 | L · PR | **Caret boundary**: Words is the only thing that drives the caret and pace caret; line-jump/tape-scroll handoff becomes internal to Words; pace-caret timing moves to a DOM-free module outputting a word/letter target; caret and pace caret get `data-ui-element`. Caret and words layout read the typed input from the render store (input writes it alongside the EventLog), not the engine's `getCurrentInput()`. Decide the caret internals here (reactive, imperative handle, or a mix) | T2 | Outside caret callers (test-ui, timer, focus, WordsInput) |
| [ ] | T4 | S · commit | **Word registry private** to Words; only the synchronous overflow check stays exported | T3 | The public word-elements bridge |
| [ ] | T5 | L · PR | **Delete test-ui**: sound/keymap/monkey-power triggers become effects or input-layer calls; autofocus moves to WordsInput; fades move to TestPage, as does the pre-test scroll to the test block (the focus flow keeps requesting Words' active-line recenter during a test). Add the **input-layer lint rule** (no component/UI imports) | T4, EP1, EP2, L1, L2 | The glue module test-logic and input call |
| [ ] | T6 | split | **Engine split**, in three PRs: | T5 | test-logic ↔ UI coupling |
| [ ] | T6a | L · PR | Engine owns its state module (phase, active word index, words, timer, live stats); commands start/restart/finish/fail; the general test state keeps only UI state; drop its `__nonReactive` (layout emulator and keydown read engine/UI state directly). The engine owns the EventLog: event arrays, pressed keys, `logTestEvent` as a command; derived signals for current input, live stats and the frozen log (replaces `lastEventLog` in the test state module); key-code helpers (`getTestEventCode`, `keysToTrack`) move to input. Add the **engine lint rule** (no UI/input/DOM; data layer allowed) | T5 | |
| [ ] | T6b | L · PR | **Restarts via `changeRequiresRestart`**: the engine requests one merged restart on flagged config changes; test settings retaken while faded out; render reads the test settings; callers stop restarting; tags stay live. The EventLog context reads the test settings, not live config. The restart calls `replaceWords` outside effects and batches: it measures the new words synchronously, inside one it would measure the old words | T6a, C1 | Lost settings mid-restart, flashes, double restarts |
| [ ] | T6c | L · PR | **Finish split**: synchronous `finish()`/`fail()` (force-release keys, then freeze the EventLog; later events dropped), result computed after a paint (current active tags read via the tags getter, replacing test-logic's `__nonReactive` read), save-status signal with retry; PB check and today tracker move to the result screen (getters / async `*Once`), dropping their `__nonReactive` reads; TestPage shows the result when the fade-out ends, or a spinner until it's ready. Profile a worst-case long test | T6a | |
| [ ] | T7 | S · PR | Remove the page wrapper's **"mount only once attached" workaround**; check nothing measures before attach | T6, L3, L4, L5 | |

## Track C: config (parallel with T)

| Done | ID | Size | Step | Blocked by | Notes |
|---|---|---|---|---|---|
| [x] | C1 | S · commit | Config setter writes the store **before** dispatching the config event (and before full-config-change finished) | none | Done in [bd2cae5](https://github.com/monkeytypegame/monkeytype/commit/bd2cae518): `setConfig`/`toggleFunbox` write store → persist → event; whole-config apply resets the store with `Config`, writes per key inside one `batch` (effects run once), all before finished. Leftover for C3: funbox `activate()` writes `Config.funbox` without the store |
| [ ] | C2 | S · commit each | Replace config-bus subscribers outside the test with effects on store keys: theme controller, sound controller, quotes controller, challenge controller, commandline theme list | C1 | One PR each, all parallel |
| [ ] | C3 | M · commit per area; PR for test modules | Move mutable `Config.x` reads to the store, by area: format singleton; commandline lists; controllers; input; test modules | C1 | Parallel by area; the test-module part follows T3/T6 where they overlap |
| [ ] | C4 | L · PR | Delete the mutable config object, the config event bus and the full-config-change events; whole-config apply becomes one batched reconcile (the `batch` already exists since C1); convert remaining test subscribers (pace caret, tts, practise words, test-logic) to effects | C2, C3, T6, L2 | Last step of C |
| [ ] | C5 | M · PR | Merge commandline metadata into config metadata; command icons become icon-component types | none | Can be L-track work |

## Track U: user data (parallel with T and C)

| Done | ID | Size | Step | Blocked by | Notes |
|---|---|---|---|---|---|
| [ ] | U1 | L · PR | Single-row user collection with `getUser()` and named writes (direct writes for server-side effects, optimistic actions for user changes, incl. quote ratings); convert **all writers** (result save, xp, badges, inbox count, lb memory, streak offset, quote rate, favourite quotes, edit profile, update name, unlink Discord, Discord OAuth, auth); delete the reactive mirror; `DB.getSnapshot()` becomes a read-only shim over the row | none | Writers must move in the same PR: there's no mutable object left |
| [ ] | U2 | M · PR | Activity calendar: plain activity data in the user row; the calendar becomes a Solid component; delete the imperative test-activity modules | U1 (data shape) | Can share a PR with U1 |
| [ ] | U3 | M · PR | Remove the snapshot-updated auth event (PSA, last-signed-out-result modal read `getUser()`); auth becomes a signal the router reads, with the user-data load as state (loading/loaded/failed) plus `reloadUserData()` replacing the event's promise; delete the auth bus | U1 | |
| [ ] | U4 | S · commit per area | Readers move from the `DB.getSnapshot()` shim to `getUser()`, by area; the last PR deletes the shim and the snapshot code in `db.ts` | U1 | Parallel by area |
| [ ] | U5 | M · PR | Tags, presets and custom themes get the `getUser()` pattern: plain getters backed by a module-level reactive mirror, replacing their live-query hooks (keep `gcTime: Infinity`). Rewrite the non-test `__nonReactive` callers as Solid code reading the getters: commandline tag/preset lists, the custom-themes check in config metadata, the tag PB helpers in `db.ts` (or they go with U4) | none | Test-page callers go with T6a/T6c |
| [ ] | U6 | S · commit | Delete `__nonReactive` from every module once no caller is left | U5, T6a, T6c | Pure deletion: a caller still left means a step missed it |

## Track EP: engine prep (small, parallel)

| Done | ID | Size | Step | Blocked by | Notes |
|---|---|---|---|---|---|
| [x] | EP1 | S · commit | Restart-test bus becomes a direct engine command (logo, nav, test config, modals, quick-restart hotkey) | none | Before T5. Done: callers import `restartTest` (renamed from `restart`) from test-logic; `events/test.ts` deleted |
| [x] | EP2 | S · commit | Timer bus becomes engine-internal | none | Before T5. Done: test-logic passes `onFinish`/`onFail` to `TestTimer.start` (a direct import would be circular); word-generation error calls `fail` directly; `events/timer.ts` deleted |
| [ ] | EP3 | M · PR | Per-word facts (direction, has numbers/newlines/tabs, Korean status) computed once at generation and carried on the word/render store; redoes #7787. EventLog context keeps Korean status as one test-level boolean derived from the words, unless stats need it per word (then per word plus a version bump) | T1 | Coordinate with T3 |
| [ ] | EP4 | S · commit | Parity tests for the live-cache tallies: for typed event sequences, each tally equals its pure stat function on the built log | none | Guards the replay constraint; every later tally gets one too |

## Track L: leaves

| Done | ID | Size | Step | Blocked by |
|---|---|---|---|---|
| [ ] | L1 | M · PR | Focus mode becomes a signal; layout binds focus state; cursor hiding goes to CSS; one component owns the mouse-move exit | none (before T5) |
| [x] | L2 | L · PR | Funbox component owns funbox document state (body state, stylesheet link, CRT scanline); funbox functions stop touching the DOM and become engine plugin hooks, getting input as arguments instead of importing the EventLog; display tweaks via `data-ui-*` / funbox CSS. Done in [#8522](https://github.com/monkeytypegame/monkeytype/pull/8522): `components/core/Funbox.tsx` in App derives `fb-*`/`ignore-reduced-motion` and per-funbox links from `getAppliedFunboxes()` (set by `activate()` after validation, cleared by `clear()`), crt (`crtmode`, `#scanline`, global link) from `config.funbox` unless screenshotting; selectors unchanged; body classes via the `useBodyClasses` hook (Theme's `darkMode` and DevOptionsModal's debug classes moved too). `applyGlobalCSS`/`clearGlobal` and funbox's config-event subscriber deleted; crt loses `hasCssFile` (was loaded twice). Safari ≤16.5 crt check → `getFunboxUnsupportedReason` (metadata `isBlocked`, `toggleFunbox` setter, `activate()`). `handleKeydown`/`handleSpace` get a `FunboxInput` (`current()`, `forWord(i)`) from input instead of importing `events/data`. Hook shape left for T6a | none (before T5) |
| [ ] | L3 | M · PR | Monkey power as a component owning its canvas, positioned from the caret | T3 |
| [ ] | L4 | M · PR | Result word highlight becomes part of words history, driven by a highlighted-range signal from the chart | none |
| [ ] | L5 | M · PR | Screenshot-mode signal; elements hide through state; capture uses the result ref | none |
| [ ] | L6 | M · PR | Boot cleanup: the ready module goes into App lifecycle / a boot module; PSA, merch banner and no-CSS detection become state plus components | none |
| [ ] | L7 | S · commit | Remove stray DOM queries: account page, leaderboard table, captcha, challenge controller header, ad/analytics controllers. Done except the leaderboard table: #8524 rewrites its scroll-to-user and should switch to DataTable's `rowSelection.scrollToActiveRow` | none |
| [ ] | L8 | S · commit | Delete dead modules: result batches, character counter, discord avatar util, input indicator, unused input-validation exports, tag builder plus its spec | none |
| [ ] | L9 | M · PR | Replace the sorted-table utility with DataTable | none |
| [x] | L10 | S · commit | Commandline "fixSkillIssue" `innerHTML` hack → component or remove | none |
| [ ] | L11 | L · PR per area | SCSS → Tailwind outside the test; add `data-ui-element` to other themeable components as they're touched, moving bundled themes over | none (test-activity styles: U2) |
| [ ] | L12 | L · PR | Test/caret SCSS rewritten against `data-ui-*` (Tailwind or a small base-styles layer) | T1, T3 |

## Track CL: final cleanup

| Done | ID | Size | Step | Blocked by |
|---|---|---|---|---|
| [ ] | CL1 | M · PR | Delete the DOM-wrapper utility library, the ref-with-utils hook and `onDOMReady` | T7, all L, U2 |
| [ ] | CL2 | M · PR | DOM-query / `innerHTML` lint ban, with the server-HTML allowlist (notifications, simple modal, version history, quote-search highlight) | CL1 |
| [ ] | CL3 | M · PR | **Announced removal of legacy theme selectors** (old ids, classes, `letter`): the single break for user custom CSS; delete remaining SCSS | T1, L11, L12 |
| [ ] | CL4 | S · commit | Update coding standards and agent docs to describe only the final patterns | CL1 |

## Track TR: tribe (last)

| Done | ID | Size | Step | Blocked by |
|---|---|---|---|---|
| [ ] | TR1 | L · PR | Re-port the `newtribemerge` branch onto the final architecture (router, Words, caret boundary, engine commands), following the recorded tribe decisions | CL |

## Suggested sequencing for 2–3 people

- **Person 1 (critical path):** T0 → TH1 → T1 → T2 → T3 → T4 → T5 → T6a → T6b → T6c → T7.
- **Person 2 (state):** C1 → C2 (×5) → U1 → U2 → U3 → C3 areas → U4 → U5 → then C4, U6 once T6 lands.
- **Person 3 / agents (leaves):** EP1, EP2, L1, L2 first (they gate T5), then L8, L7, L9, L10, L4, L5, L6, C5, L11, EP4; L3 and L12 once T3 lands; EP3 after T1.
- **Converge:** C4, U6, then CL, then TR1.

## Per-step checklist

- Behaviour-preserving, or each change is listed in the PR or commit and added to the spec's "Intended deviations".
- Theme attributes added for anything themeable the PR renders; bundled themes moved over; old selectors still work until CL3.
- Input never renders or measures synchronously (apart from the overflow check).
- Test-page / app-shell harness specs green; layout steps verified in the browser via `__mt`.
- Lint boundary rules added when the PR makes a layer clean.
- Coding standards: Tailwind via the class-merge helper, the icon component, callback refs, modals registered.
- Comments updated where behaviour moved.
