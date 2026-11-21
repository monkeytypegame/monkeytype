# Browser testing (agents)

## Tools

The rest of this doc names **playwright-mcp** tools. The same concepts apply to other harnesses — eg. pi-chrome's `chrome_*` tools:

| Concept | playwright-mcp | pi-chrome |
| --- | --- | --- |
| Run JS in the page | `javascript_tool` (45s budget) | `chrome_evaluate` (5s budget) |
| Read the console | `read_console_messages` | `chrome_list_console_messages` |
| Resize the window | `resize_window` | `chrome_cdp` → `Emulation.setDeviceMetricsOverride` |
| Screenshot / recording | screenshots, `gif_creator` | `chrome_screenshot` (no gif) |

pi-chrome specifics the gotchas below don't assume:

- `chrome_evaluate`'s 5s budget kills long measurement loops: fire-and-forget (write results onto a `window.__…` global, return immediately) and poll with a separate call.
- Console capture starts only after instrumentation is installed (any snapshot/evaluate call) and a page load drops it: snapshot once after a load if you need the full log.

Everything else here (dev server, `__mt`, gotchas) is tool-agnostic.

## Dev server

Assume the frontend dev server is already running at `http://localhost:3000`. Never start it (a second instance grabs port 3001) and never probe it (`lsof`, `ps`, `curl` — sandboxed curl can't reach localhost anyway).

Workspace packages (`packages/*`) resolve to source in the frontend's dev server, build and tests (`frontend/vite-plugins/workspace-packages.ts`); their `dist` only serves the backend, so package edits need no rebuild.

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

Members and their usage: the JSDoc in `expose.ts` (the `mt` object and the functions it lists). Read it before scripting.

Older globals: `frontend/src/ts/console-globals.ts` (all envs).

## Console

`read_console_messages` with a `pattern` — logger output is noisy. Errors from `utils/logger.ts` are prefixed `ERR`.

The console buffer survives reloads, so hot-reload errors from earlier edits look current. After reloading, log a marker first (`console.error("MARK")`) and trust only errors after it.

`read_console_messages` only records from its first call on a tab. On a new tab, call it once before the steps you want covered; an empty result from a first call proves nothing.

## Gotchas

- A test in progress blocks navigation with a "Leave site?" dialog: `__mt.restartTest()` before navigating away.
- Switching git branches hot-reloads the page and kills a running `javascript_tool` script; wait for `__mt` again after a checkout.
- A hot-updated module can leave stale state behind (two copies of a state module's signals), faking bugs like invisible words. Edits, checkouts, stash and commits (lint-staged rewrites files) all hot-update: when `__mt.hotUpdates()` isn't empty, navigate to reload before measuring. If something looks like a regression, reproduce it on a fresh load first.
- `static/` files (themes, quotes, sounds, images) never hot-reload and `__mt.hotUpdates()` stays empty: reload the page manually before measuring, and hard-reload (bypass cache) if a plain reload still serves the old file.
- `resize_window` does nothing to a maximized or fullscreen window: check `innerHeight` after resizing. To get a words wrapper taller than the window, raise `fontSize` with `__mt.setConfig` instead (and restore it after).
- Signed in, the account's config is applied once its data loads (seconds after a page load) and replaces earlier `__mt.setConfig` changes: `await __mt.whenUserDataLoaded()` first. `__mt.quickLogin()` already waits for it.
- `__mt` is dev only. Production builds (`vite preview`) are driven through localStorage and the DOM.

## Profiling

Performance comparisons follow `docs/PROFILING.md`.
