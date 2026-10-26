# Browser testing (agents)

## Dev server

Assume the frontend dev server is already running at `http://localhost:3000`. Never start it (a second instance grabs port 3001) and never probe it (`lsof`, `ps`, `curl` — sandboxed curl can't reach localhost anyway).

If a page load fails (`ERR_CONNECTION_REFUSED`, "This site can't be reached"), stop immediately and ask the user to start the server.

## Tabs

New tabs open on `chrome://newtab`, which rejects `javascript_tool` and screenshots. Navigate to `http://localhost:3000` first, then interact.

Before testing anything animated (page fades, anime.js, carets), time one frame. A hidden tab or a hidden built-in browser pane throttles `requestAnimationFrame` (seconds per frame) while `document.visibilityState` still says `visible`, so fades stall and pages look stuck on the old page or at opacity 0:

```js
const t = performance.now();
await new Promise((r) => requestAnimationFrame(r));
performance.now() - t; // > 100ms: throttled
```

If throttled, ask the user to bring the browser to the front (built-in pane: Cmd+Shift+B) before testing anything animated.

`javascript_tool` calls time out at 45s and the result is lost. Keep each call under ~40s; split long measurements (eg. one variant per call).

## Verifying what's on screen

Claims about what the user sees ("never two pages at once", "no flash", "loader shows") need what's painted: screenshots, or `gif_creator` frames. Computed styles and DOM queries miss painted-but-not-in-DOM content, eg. View Transition snapshots drawn over the live page, and content a `Suspense` fallback swapped out. Use DOM sampling for timings, screenshots to confirm the visual claim.

## `window.__mt` (dev only)

Defined in `frontend/src/ts/dev/expose.ts`; absent in production builds. Wait for it after load:

```js
for (let i = 0; i < 30 && !window.__mt; i++) await new Promise((r) => setTimeout(r, 300));
```

| Member | Use |
| --- | --- |
| `navigate({ to, params, search })` | client-side route change; `navigate({ href: "/settings?x=1" })` for a raw path |
| `isNavigating()` | a navigation is in progress (the loading page may cover the page) |
| `getRoutePage()` | page name of the last resolved route ("loading" before the first or after a failed load) |
| `getConfig.<key>` | read config: `getConfig` is the config store object, not a function (`getConfig.fontSize`) |
| `setConfig(key, value)` | write config. Doesn't restart the test (callers restart until T6b): use `runCommand` when the restart matters |
| `showModal(id)` | open a modal by `ModalId` |
| `restartTest()` | restart the typing test |
| `typeText(text, msPerChar?)` | type through the real input handlers; `"\n"` is a line break, `"\b"` a backspace. Paced with `msPerChar`, else all in one task |
| `wordsSnapshot()` | rendered `#words` children: words (index, classes, letters with text/icon/classes) and newline siblings |
| `caretOffset()` | `{ dx, dy }` px from the caret to where it should be; a few px is on |
| `checkLayout()` | test page layout problems, `[]` when right: active word inside the words wrapper, caret and words input on it, 3 full lines (unless all lines show), tape anchor at the tape margin. Run it after any change to the test UI |
| `runCommand(id, input?)` | run a commandline command through the commandline: opens it, waits for the out of focus blur, executes, closes. `setConfig` skips that blur, so reproduce commandline bugs with this. Ids: `set<ConfigKey>Custom` inputs (`setFontSizeCustom`), `set<ConfigKey><Value>` (booleans `True`/`False`: `setPunctuationFalse`), `applyPreset<presetId>` |
| `hotUpdates()` | modules hot-updated since the page loaded; must be `[]` before measuring |
| `quickLogin()` | sign in with the `QUICK_LOGIN_*` account from the frontend `.env` (same as the DevOptions modal button). Use it whenever a check needs an account: presets, tags, results, sync |
| `setCustomText(text)` | start a custom test with `text` (newlines become line breaks), as the custom text modal's simple mode |
| `setPreloading(enabled)` | turn intent preloading (hovered/focused links run the next page's guards and loaders) off or back on, no rebuild; resets on reload. Permanent switch: `INTENT_PRELOADING` in `router/create-router.ts` |
| `signals(filter?)` | list tracked Solid signals `{name, source, value}`, filter by name/source substring |
| `getSignal(name)` / `setSignal(name, value)` | read/write a tracked signal by exact name |

Read app state through these members or the DOM. Importing app modules from an injected script (`import("/ts/...")`) loads a separate module instance with its own state.

Older globals from `frontend/src/ts/index.tsx` (`addToGlobal`) also exist in all envs: `config`, `snapshot`, `qs`/`qsa`, `lastEventLog()`, `currentEventLog()`, `toggleDebugLogs()`. Presets and tags live in query collections, not `snapshot()`.

## Console

`read_console_messages` with a `pattern` — logger output is noisy. Errors from `utils/logger.ts` are prefixed `ERR`.

The console buffer survives reloads, so hot-reload errors from earlier edits look current. After reloading, log a marker first (`console.error("MARK")`) and trust only errors after it.

`read_console_messages` only records from its first call on a tab. On a new tab, call it once before the steps you want covered; an empty result from a first call proves nothing.

## Gotchas

- A test in progress blocks navigation with a "Leave site?" dialog: `__mt.restartTest()` before navigating away.
- Switching git branches hot-reloads the page and kills a running `javascript_tool` script; wait for `__mt` again after a checkout.
- A hot-updated module can leave stale state behind (two copies of a state module's signals), faking bugs like invisible words. Edits, checkouts, stash and commits (lint-staged rewrites files) all hot-update: when `__mt.hotUpdates()` isn't empty, navigate to reload before measuring. If something looks like a regression, reproduce it on a fresh load first.
- `__mt` is dev only. Production builds (`vite preview`) are driven through localStorage and the DOM.

## Profiling

Performance comparisons follow `docs/PROFILING.md`.
