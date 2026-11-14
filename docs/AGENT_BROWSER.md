# Browser testing (agents)

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

Older globals: the `addToGlobal` calls in `frontend/src/ts/index.tsx` (all envs).

## Console

`read_console_messages` with a `pattern` — logger output is noisy. Errors from `utils/logger.ts` are prefixed `ERR`.

The console buffer survives reloads, so hot-reload errors from earlier edits look current. After reloading, log a marker first (`console.error("MARK")`) and trust only errors after it.

`read_console_messages` only records from its first call on a tab. On a new tab, call it once before the steps you want covered; an empty result from a first call proves nothing.

## Gotchas

- A test in progress blocks navigation with a "Leave site?" dialog: `__mt.restartTest()` before navigating away.
- Switching git branches hot-reloads the page and kills a running `javascript_tool` script; wait for `__mt` again after a checkout.
- A hot-updated module can leave stale state behind (two copies of a state module's signals), faking bugs like invisible words. Edits, checkouts, stash and commits (lint-staged rewrites files) all hot-update: when `__mt.hotUpdates()` isn't empty, navigate to reload before measuring. If something looks like a regression, reproduce it on a fresh load first.
- `resize_window` does nothing to a maximized or fullscreen window: check `innerHeight` after resizing. To get a words wrapper taller than the window, raise `fontSize` with `__mt.setConfig` instead (and restore it after).
- `__mt` is dev only. Production builds (`vite preview`) are driven through localStorage and the DOM.

## Profiling

Performance comparisons follow `docs/PROFILING.md`.
