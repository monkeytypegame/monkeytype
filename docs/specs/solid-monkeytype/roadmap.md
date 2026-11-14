Status: ready-for-agent

# Roadmap: getting to the fully-Solid frontend

Companion to `spec.md`. Every step is one small change, behaviour-preserving apart from listed and recorded deviations. IDs are stable so steps can reference them (`Blocked by: T3`).

**Size** column: S is one area, low risk, under ~150 lines; M is several files or a visible behaviour change; L is cross-cutting or touches the typing loop. **commit** goes straight to master (tests, lint and a browser check still apply); **PR** gets a review first: anything that changes what users see, the typing loop, theme selectors or the data layer.

## Step by step

Each step can start once the previous step's **bold** items are done. Everything listed on one step can run in parallel.

- [ ] 1. **H1–H5** housekeeping, then start all at once: **T0** (merge #8507), **C1**, **EP1**, **EP2**, **L1**, **L2**, plus any of U1, C5, EP4, L4–L11.
- [ ] 2. **TH1** test-page harness, then **T1** `data-ui-*` on words and letters. Alongside: U2, U3, U4 (after U1), C2, C3.
- [x] 3. **T2** joining-script dots. Alongside: EP3.
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
   T0 #8507 ─► T1 words/letters data-ui-* ─► T2 joining dots ─► T3 caret boundary ─► T4 registry private ─► T5 delete test-ui ─► T6 engine split (T6a–c) ─► T7 drop page-mount workaround
   TH1 test-page harness (after T0, before T1)            ▲ needs EP1, EP2, L1, L2           ▲ needs L3, L4, L5
                                                          │
 C: config            C1 ─► C2×5, C3 areas (parallel) ──────────────────────────► C4 delete Config + configEvent (needs T6)
 U: user data         U1 ─► U2, U3 ─► U3a ─► U8, U4 (parallel);  U7 ─► U5a ─► U5b, U5c, U5d ────► U6 delete __nonReactive (needs T6a, T6c)
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
| **T2** joining-script dots | TH1 | The harness is the safety net from here on |
| **T5** delete test-ui | EP1, EP2, L1, L2 | test-ui still calls the timer event and funbox; they need new homes first (focus mode is already a plain `setFocusMode` call) |
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

Fully independent from start to finish: H, U1–U5d, U7, C1–C3, C5, EP1, EP2, EP4, L1, L2, L4–L10.

## Track H: housekeeping (now, minutes)

| Done | ID | Size | Step | Blocked by | Notes |
|---|---|---|---|---|---|
| [x] | H1 | XS · merge | Merge **#8490** (app-shell test speed-up) | none | Done in [#8490](https://github.com/monkeytypegame/monkeytype/pull/8490). Faster harness for every later step; merge before TH1 if TH1 extends the app-shell harness |
| [x] | H2 | XS · close | Close **#8031** | none | Done: [#8031](https://github.com/monkeytypegame/monkeytype/pull/8031) closed. Superseded by master's PractiseWordsModal |
| [ ] | H3 | XS · close | Close **#7373** and **#7717** | none | Superseded by the user store (U1) |
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
| [x] | T0 | M · PR #8507 | Merge **#8507**: Words triggers its own layout (flush subscription, config/font/resize effects). Done in [#8507](https://github.com/monkeytypegame/monkeytype/pull/8507) | none | test-ui's layout calls |
| [x] | T1 | L · PR | **Theme attributes on the test and result words**: words (one attribute per mode: `data-ui-word-highlight`, `data-ui-blind`, `data-ui-flipped`, `data-ui-colorful`, `data-ui-joining-script`, `data-ui-rtl`), word (`WordStatus`, `data-ui-active`), letter (`LetterStatus`, tab/newline variant), typo hint; result `wordsHistory`/`replayWords`, word (`WordStatus`, typed = committed), letter (`ResultLetterStatus`, `data-ui-corrected`, `data-ui-extra-corrected`). `<letter>`/`<hint>` keep their tags and classes so old selectors keep working (spans in CL3); code finds letters by `LETTER_SELECTOR`. Bundled theme and funbox CSS moved over (computed styles unchanged across highlight/blind/flipped/colorful), adding the words `data-ui-rtl` and `wordsWrapper`; left: funbox `read_ahead_disabled`/`#wordsInput` (L2). Harness reads `data-ui-*` (`state` + `isActive`). Keystroke benchmark: no change | T0, TH1 | The made-up element; proves the theme attribute approach before the caret measures letters |
| [x] | T2 | M · PR | **Break joining** computed in the layout pass, rendered as reactive class/style on Word; delete the break-joining module's DOM writes. Done in [#8562](https://github.com/monkeytypegame/monkeytype/pull/8562): replaced instead of moved. Joining-script letters stay inline under the dots typed effect and draw their own dot (CSS only, a `::before` copy from `data-char` runs the shrink), so nothing is measured; the break-joining module, its layout calls and config effects are deleted, and Word uses `cn` (no outside class writes left). Deviations in the spec | T1, TH1 | The only outside writes into Word elements |
| [ ] | T3 | L · PR | **Caret boundary**: Words is the only thing that drives the caret and pace caret; line-jump/tape-scroll handoff becomes internal to Words; pace-caret timing moves to a DOM-free module outputting a word/letter target; caret and pace caret get `data-ui-element`. Caret and words layout read the typed input from the render store (input writes it alongside the EventLog), not the engine's `getCurrentInput()`. Decide the caret internals here (reactive, imperative handle, or a mix). Fix the tape offset for a word whose direction differs from the test's: after EP3 the caret is still up to ~105px off its letter (measured; ~194px seen in word tape), mixed custom text and polyglot only | T2 | Outside caret callers (test-ui, timer, focus, WordsInput) |
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
| [x] | C2 | S · commit each | Replace config-bus subscribers outside the test with effects on store keys: theme controller, sound controller, quotes controller, challenge controller, commandline theme list | C1 | Done in one PR, [#8526](https://github.com/monkeytypegame/monkeytype/pull/8526). Effects only run on a changed value: re-picking a setting no longer re-runs its reaction (challenge stays loaded, quote queue not reshuffled). The random theme is a signal in `states/theme`; `overrideConfig` on `theme` and `customTheme` clears it on a same-value write, the one case effects can't see. Theme reactions resolve one configured theme; picking a theme turns auto switch off via `overrideConfig`, so whole-config apply sets `autoSwitchTheme` last |
| [ ] | C3 | M · commit per area; PR for test modules | Move mutable `Config.x` reads to the store, by area: format singleton; commandline lists; controllers; input; test modules | C1 | Parallel by area; the test-module part follows T3/T6 where they overlap |
| [ ] | C4 | L · PR | Delete the mutable config object, the config event bus and the full-config-change events; whole-config apply becomes one batched reconcile (the `batch` already exists since C1); convert remaining test subscribers (pace caret, tts, practise words, test-logic) to effects | C2, C3, T6, L2 | Last step of C. Since C2 no subscriber outside the test listens for full-config-change; `autoSwitchTheme` sits last in `lastConfigsToApply` only because `overrideConfig` turns it off on a theme pick, and that entry can go once apply no longer runs overrides. Apply clears the random theme only through those overrides (the `customTheme` same-value write), so it must clear it explicitly once they stop running. Converted effects only fire on a changed value, not on re-picking the current one |
| [x] | C5 | M · PR | Merge commandline metadata into config metadata; command icons become icon-component types | none | Done in [#8537](https://github.com/monkeytypegame/monkeytype/pull/8537): each config key's metadata has a required `commandline` (`null` with a reason for keys set elsewhere or with hand-built lists); `CommandlineConfigKey` is derived from it. Side effects (`afterExec` restarts, sound/font `hover` previews) moved to `commandline/config-actions.ts`, since the modules they call import the setters; its restarts go with T6b. Generated options use the settings labels (`optionLabel` from `optionsMetadata`), command names the settings `displayString`; renamed labels are in the spec's intended deviations (blind mode keeps on/off). `Command.icon`/`iconType` → `fa: FaObject`; the modal's text-icon branch was dead and is gone |

## Track U: user data (parallel with T and C)

| Done | ID | Size | Step | Blocked by | Notes |
|---|---|---|---|---|---|
| [x] | U1 | L · PR | User store with `getUser()` and named writes (direct writes for server-side effects, optimistic actions for user changes, incl. quote ratings); convert **all writers** (result save, xp, badges, inbox count, lb memory, streak offset, quote rate, favourite quotes, edit profile, update name, unlink Discord, Discord OAuth, auth); delete the reactive mirror; `DB.getSnapshot()` becomes a read-only shim over the store | none | Done: `states/user.ts` (one Solid store, no collection, spec Q30; `loadUserData`/`clearUser` for auth); `DB.getSnapshot = getUser` (deleted in U4); last-result signal in `states/last-result.ts`. The store was replaced by the user query in U7 |
| [ ] | U2 | M · PR | Activity calendar (user store already holds plain activity data; the per-year cache already sits in `ActivityCalendar.tsx`): the calendar becomes a Solid component; delete the imperative test-activity modules | U1 (data shape) | Can share a PR with U1 |
| [x] | U3 | M · PR | Remove the `userLoaded` auth event (was snapshot-updated) (PSA, last-signed-out-result modal read `getUser()`); PSA's `authEvent` subscription (`Psa.init`, started by boot) follows the auth signal; auth becomes a signal the router reads, with the user-data load as state (loading/loaded/failed) plus `reloadUserData()` (reruns `loadUserData()`) replacing the event's promise; delete the auth bus. Done in [#8583](https://github.com/monkeytypegame/monkeytype/pull/8583): `getAuthState()` (`states/core`, unknown/signedIn/signedOut) beside `userId`, both set by `auth.tsx` `onAuthStateChanged`; `getUserDataLoadState()` (idle/loading/loaded/failed) and `reloadUserData()` in `auth.tsx` (the load runs before the state turns signed in, so the router sees it loading); `createRouterAuth` reads those accessors (routes unchanged); PSA and the last-signed-out-result modal are effects on them; Google sign-up goes through `onAuthStateChanged`; `events/auth.ts` deleted. Behaviour change: a failed load no longer signs out; the loading page shows the error with Retry and "Continue signed out" (a loading step's `fallback`, `RouterAuth.signOut`), saying the sign in worked (its `hint`, with the server's reason below and a warning icon) and no notification; only Retry loads again (then disabled for 15s, counting down); `isPendingShown` ignores routes pending behind a failed one, so a failed first load shows its error instead of the spinner | U1 | The load state is its own signal, not the user query's status: it also covers tags, presets, custom themes and remote config |
| [x] | U3a | M · PR | Split auth in three: `firebase.ts` is the SDK adapter and the only writer of the auth signal (`auth.tsx` stops calling `setUserId`); `auth.tsx` keeps the auth actions only (sign in/up, providers, reauth, verification email); a new session-load module owns the user-data load (`getDataAndInit`/`loadUser`: user, tags, presets, custom themes, remote config, Sentry user), its state and `reloadUserData()`, as an effect on the auth signal turning signed in. Delete the `init(onAuthStateChanged)` callback wiring in `index.tsx` and `dispatchAuthStateChanged` | U3 | Done in <commit>: `session-load.ts` keys the load on `getUserId()`; its state is derived (idle signed out, loading while signed in until that user's load ends, so the router never sees idle after sign-in); signing out clears the Sentry user, the `["user"]` reset clears the queries. `firebase.ts`: `initFirebase()`, `finishSignUp(user)` ends a sign-up's ignored auth callback. Sign-up no longer awaits the load. Fixed: a failed email sign-up left the auth callback ignored |
| [x] | U4 | S · commit per area | Readers move from the `DB.getSnapshot()` shim to `getUser()`, by area; the last PR deletes the shim and the snapshot code in `db.ts` | U1 | Done in 0012c6f0f: shim deleted, readers import `getUser()`; also renamed `Snapshot`→`UserData`, `SnapshotResult`→`NormalizedLocalResult` (now in `collections/results.ts`), `SnapshotInitError`→`UserDataLoadError`, `snapshotUpdated`→`userLoaded`, `window.snapshot`→`window.userData` |
| [-] | U5 | M · PR | ~~Tags, presets and custom themes get the `getUser()` pattern: plain getters backed by a module-level reactive mirror of each collection~~ | none | Superseded by U5a–U5d (spec Q32): they become session queries like the user (U7) instead. #8564 closed |
| [x] | U5a | S · PR | Optimistic mutations roll back by id for lists (tags, presets, custom themes): on failure only the items the mutation changed roll back, except items changed again since | U7 | Done in [#8571](https://github.com/monkeytypegame/monkeytype/pull/8571): the query's shape picks the rollback. `createSessionQuery` takes an `id` for a list (required when the data is an array, refused otherwise); the query exposes it as `id`, and `optimisticMutation` rolls a list back by id and a record by field. List recipes edit the list in place; inserts with a temporary id need an idempotent recipe that swaps in the server's id on success |
| [x] | U5b | M · PR | Tags become their own list session query (`id: tag._id`) beside the user, reading the user endpoint through `fetchUserFromApi` like the user query (one shared request); read through `getTags()` / `getActiveTags()`, actions as optimistic mutations (by id from the query's shape); `active` stays a local signal backed by localStorage. Rewrite the non-test `__nonReactive` tag callers (commandline tag list, the tag PB helpers `getLocalTagPB`/`saveLocalTagPB`) against the getters; delete the tags collection | U5a | Done in [#8573](https://github.com/monkeytypegame/monkeytype/pull/8573): `queries/tags.ts`; the auth flow's blocking step runs `loadTags()` beside `loadUserData()` (replacing `waitForTagsReady`). `ape/user.ts` stays: it shares the request and caches the response until sign-out, and filter presets keep reading it. `UserData` holds neither tags nor filter presets. Active tags: sync `toggleTagActive(id)` / `setActiveTags(ids)` / `isTagActive(id)`; tag actions return a `Result`. The results collection checks `areTagsLoaded()`. Test-page callers (test-logic, result PB) and the results collection switched to the getters by import only; their rewrite stays with T6a/T6c |
| [x] | U5c | M · PR | Presets become a session query (`createSessionQuery`), downloaded in the blocking user-data step; actions as by-id optimistic mutations; rewrite the commandline preset list against the getter; delete the presets collection | U5a | Done in [#8578](https://github.com/monkeytypegame/monkeytype/pull/8578): `queries/presets.ts`; the auth flow's blocking step runs `loadPresets()` beside `loadUserData()`/`loadTags()` (a failed download throws `UserDataLoadError` with the status, so sign-in shows the retry). Reads `getPresets()` / `getPreset(id)`; `addPreset` / `editPreset` / `deletePreset` return a `Result` |
| [x] | U5d | M · PR | Custom themes become a session query, downloaded on sign in; actions as by-id optimistic mutations; the custom-themes check in config metadata reads the getter; delete the custom-themes collection | U5a | Done in [#8581](https://github.com/monkeytypegame/monkeytype/pull/8581): `queries/custom-themes.ts`; custom themes join the blocking user-data step (`loadCustomThemes()` beside `loadPresets()`; a failed download throws `UserDataLoadError`, so sign-in shows the retry). Reads `getCustomThemes()` / `getCustomTheme(id)`; `addCustomTheme` / `editCustomTheme` / `deleteCustomTheme` return a `Result`. All callers use the getters |
| [ ] | U6 | S · commit | Delete `__nonReactive` from every module once no caller is left | U5b, U5c, U5d, T6a, T6c | Pure deletion: a caller still left means a step missed it |
| [x] | U7 | M · PR | The user moves from the Solid store to a TanStack Query (spec Q31): `queries/user.ts` replaces `states/user.ts`; `getUserData()` reads the cache, `useUser()` gives its status, actions become TanStack mutations; sign-out clears it through the `["user"]` reset | U1 | Done in [#8568](https://github.com/monkeytypegame/monkeytype/pull/8568): `createSessionQuery` (user-scoped key from a name, never stale, `networkMode: "always"`) and `optimisticMutation`/`runMutation` (field-level rollback) in `queries/utils/`, for later session queries. `ape/user.ts` still caches the raw user response for tags and filter presets. Effects needing one user field key on it (Nav level on `uid`, the calendar on a `testActivity` memo) |
| [ ] | U8 | L · PR | Auth provider interface, so self-hosting works without Firebase: frontend `auth.tsx`, the Google sign-up modal and the API token (`ape/adapters/ts-rest-adapter.ts`) talk to an interface (init, sign in with email or provider, sign up, sign out, token, reauth, link/unlink, an own user type) with `firebase.ts` as one implementation; backend token checks (`middlewares/auth.ts`) and user admin (`firebase-admin`) behind a matching interface. Decide first: which methods a non-Firebase backend supports, and email verification / password reset without Firebase | U3a | Cheaper first step: an offline-only (no auth) mode, which mostly exists already as the Firebase-failed-to-load path |

## Track EP: engine prep (small, parallel)

| Done | ID | Size | Step | Blocked by | Notes |
|---|---|---|---|---|---|
| [x] | EP1 | S · commit | Restart-test bus becomes a direct engine command (logo, nav, test config, modals, quick-restart hotkey) | none | Before T5. Done: callers import `restartTest` (renamed from `restart`) from test-logic; `events/test.ts` deleted |
| [x] | EP2 | S · commit | Timer bus becomes engine-internal | none | Before T5. Done: test-logic passes `onFinish`/`onFail` to `TestTimer.start` (a direct import would be circular); word-generation error calls `fail` directly; `events/timer.ts` deleted |
| [x] | EP3 | M · PR | Word facts computed once at generation; redoes #7787. Direction is carried on the word/render store; has numbers/newlines/tabs and Korean status stay test-level, scanned from the wordset. EventLog context keeps Korean status as one test-level boolean derived from the words, unless stats need it per word (then per word plus a version bump) | T1 | Coordinate with T3. Done in [#8557](https://github.com/monkeytypegame/monkeytype/pull/8557): each word resolves its direction from its first strong character and lays out its letters in it, and the caret reads that direction instead of checking per letter. Tape stays anchored by the test's direction, which leaves the caret off in mixed-direction tests with tape on (see T3); this was already there and is about 6–9× smaller than before |
| [x] | EP4 | S · commit | Parity tests for the live-cache tallies: for typed event sequences, each tally equals its pure stat function on the built log | none | Guards the replay constraint; every later tally gets one too. Done in [0bca3be](https://github.com/monkeytypegame/monkeytype/commit/0bca3beba): `live-cache.spec.ts` checks accuracy against `getAccuracy` and ms since last input against the new `getMsSinceLastInputEvent`; timer start has no pure counterpart (wall-clock anchor). Prior commit [ae5b277](https://github.com/monkeytypegame/monkeytype/commit/ae5b277ba): accuracy is `null` with no counted inputs on both sides (callers keep 100 live, 0 in the result, min-acc skipped) |

## Track L: leaves

| Done | ID | Size | Step | Blocked by |
|---|---|---|---|---|
| [x] | L1 | M · PR | Focus mode becomes a signal; layout binds focus state; cursor hiding goes to CSS; one component owns the mouse-move exit. Done in [#8519](https://github.com/monkeytypegame/monkeytype/pull/8519): `isFocusMode`/`setFocusMode` (rAF-deferred) in states/test; `data-focused` on app, header, footer, banners; `FocusModeExit`; caret blink follows the signal; `test/focus.ts` deleted | none (before T5) |
| [x] | L2 | L · PR | Funbox component owns funbox document state (body state, stylesheet link, CRT scanline); funbox functions stop touching the DOM and become engine plugin hooks, getting input as arguments instead of importing the EventLog; display tweaks via `data-ui-*` / funbox CSS. Done in [#8522](https://github.com/monkeytypegame/monkeytype/pull/8522): `components/core/Funbox.tsx` in App derives `fb-*`/`ignore-reduced-motion` and per-funbox links from `getAppliedFunboxes()` (set by `activate()` after validation, cleared by `clear()`), crt (`crtmode`, `#scanline`, global link) from `config.funbox` unless screenshotting; selectors unchanged; body classes via the `useBodyClasses` hook (Theme's `darkMode` and DevOptionsModal's debug classes moved too). `applyGlobalCSS`/`clearGlobal` and funbox's config-event subscriber deleted; crt loses `hasCssFile` (was loaded twice). Safari ≤16.5 crt check → `getFunboxUnsupportedReason` (metadata `isBlocked`, `toggleFunbox` setter, `activate()`). `handleKeydown`/`handleSpace` get a `FunboxInput` (`current()`, `forWord(i)`) from input instead of importing `events/data`. Hook shape left for T6a | none (before T5) |
| [ ] | L3 | M · PR | Monkey power as a component owning its canvas, positioned from the caret; replaces App's `MonkeyPower.init` on mount (L6 stopgap) | T3 |
| [ ] | L4 | M · PR | Result word highlight becomes part of words history, driven by a highlighted-range signal from the chart | none |
| [ ] | L5 | M · PR | Screenshot-mode signal; elements hide through state (incl. the static `#nocss` box); capture uses the result ref | none |
| [x] | L6 | M · PR | Boot cleanup: the ready module goes into App lifecycle / a boot module; PSA, merch banner and no-CSS detection become state plus components. Done: DOM-free `boot.ts` (called after render) awaits config then auth, sets app ready, shows merch banner, syncs server config, registers the service worker, and starts connection listeners (`initConnection`, was `onDOMReady`) and PSA (`Psa.init`, still on the auth bus until U3); App calls `MonkeyPower.init` on mount until L3 (the body transition gate went in 99ef85bb6: the first paint has the stored theme); `NoCssDetails` portals into empty mount points of the static `#nocss` box; `ready.ts` and `no-css.ts` deleted; the app has no `onDOMReady` callers left (`email-handler.html` still uses it, see CL1) | none |
| [ ] | L7 | S · commit | Remove stray DOM queries: account page, leaderboard table, captcha, challenge controller header, ad/analytics controllers. Done except the leaderboard table: #8524 rewrites its scroll-to-user and should switch to DataTable's `rowSelection.scrollToActiveRow` | none |
| [ ] | L8 | S · commit | Delete dead modules: result batches, character counter, discord avatar util, input indicator, unused input-validation exports, tag builder plus its spec | none |
| [ ] | L9 | M · PR | Replace the sorted-table utility with DataTable | none |
| [x] | L10 | S · commit | Commandline "fixSkillIssue" `innerHTML` hack → component or remove | none |
| [ ] | L11 | L · PR per area | SCSS → Tailwind outside the test; add `data-ui-element` to other themeable components as they're touched, moving bundled themes over | none (test-activity styles: U2) |
| [ ] | L12 | L · PR | Test/caret SCSS rewritten against `data-ui-*` (Tailwind or a small base-styles layer) | T1, T3 |

## Track CL: final cleanup

| Done | ID | Size | Step | Blocked by |
|---|---|---|---|---|
| [ ] | CL1 | M · PR | Delete the DOM-wrapper utility library, the ref-with-utils hook and `onDOMReady` (the app has none since L6; `email-handler.html`, a separate Vite entry, still imports `qs` and `onDOMReady` from `utils/dom`, so migrate that page first) | T7, all L, U2 |
| [ ] | CL2 | M · PR | DOM-query / `innerHTML` lint ban, with the server-HTML allowlist (notifications, simple modal, version history, quote-search highlight) | CL1 |
| [ ] | CL3 | M · PR | **Announced removal of legacy theme selectors** (old ids, classes, `letter`): the single break for user custom CSS; `<letter>`/`<hint>` become `<span>`s (live test, words history, replay) and drop their state classes; delete remaining SCSS | T1, L11, L12 |
| [ ] | CL4 | S · commit | Update coding standards and agent docs to describe only the final patterns | CL1 |

## Track TR: tribe (last)

| Done | ID | Size | Step | Blocked by |
|---|---|---|---|---|
| [ ] | TR1 | L · PR | Re-port the `newtribemerge` branch onto the final architecture (router, Words, caret boundary, engine commands), following the recorded tribe decisions | CL |

## Suggested sequencing for 2–3 people

- **Person 1 (critical path):** T0 → TH1 → T1 → T2 → T3 → T4 → T5 → T6a → T6b → T6c → T7.
- **Person 2 (state):** C1 → C2 (×5) → U1 → U2 → U3 → U3a → C3 areas → U4 → U7 → U5a → U5b–U5d → then C4, U6 once T6 lands.
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
