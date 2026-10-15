# Browser testing (agents)

## Dev server

Assume the frontend dev server is already running at `http://localhost:3000`. Never start it (a second instance grabs port 3001) and never probe it (`lsof`, `ps`, `curl` — sandboxed curl can't reach localhost anyway).

If a page load fails (`ERR_CONNECTION_REFUSED`, "This site can't be reached"), stop immediately and ask the user to start the server.

## Tabs

New tabs open on `chrome://newtab`, which rejects `javascript_tool` and screenshots. Navigate to `http://localhost:3000` first, then interact.

Before testing anything animated (page fades, anime.js, carets), check `document.visibilityState`. In a `hidden` tab Chrome pauses `requestAnimationFrame`, so fades never finish and pages look stuck at opacity 0. If it's `hidden`, ask the user to bring the Chrome window to the front.

## `window.__mt` (dev only)

Defined in `frontend/src/ts/dev/expose.ts`; absent in production builds. Wait for it after load:

```js
for (let i = 0; i < 30 && !window.__mt; i++) await new Promise((r) => setTimeout(r, 300));
```

| Member | Use |
| --- | --- |
| `navigate(url)` | client-side route change |
| `getActivePage()` | current page name |
| `getConfig` / `setConfig(key, value)` | read/write config |
| `showModal(id)` | open a modal by `ModalId` |
| `restart()` | restart the typing test |
| `signals(filter?)` | list tracked Solid signals `{name, source, value}`, filter by name/source substring |
| `getSignal(name)` / `setSignal(name, value)` | read/write a tracked signal by exact name |

Read app state through these members or the DOM. Importing app modules from an injected script (`import("/ts/...")`) loads a separate module instance with its own state.

Older globals from `frontend/src/ts/index.tsx` (`addToGlobal`) also exist in all envs: `config`, `snapshot`, `qs`/`qsa`, `lastEventLog()`, `currentEventLog()`, `toggleDebugLogs()`.

## Console

`read_console_messages` with a `pattern` — logger output is noisy. Errors from `utils/logger.ts` are prefixed `ERR`.
