# Browser testing (agents)

## Dev server

Assume the frontend dev server is already running at `http://localhost:3000`. Never start it (a second instance grabs port 3001) and never probe it (`lsof`, `ps`, `curl` — sandboxed curl can't reach localhost anyway).

If a page load fails (`ERR_CONNECTION_REFUSED`, "This site can't be reached"), stop immediately and ask the user to start the server.

## Tabs

New tabs open on `chrome://newtab`, which rejects `javascript_tool` and screenshots. Navigate to `http://localhost:3000` first, then interact.

## `window.__mt` (dev only)

Defined in `frontend/src/ts/dev/expose.ts`; absent in production builds. Wait for it after load:

```js
for (let i = 0; i < 30 && !window.__mt; i++) await new Promise((r) => setTimeout(r, 300));
```

| Member | Use |
| --- | --- |
| `navigate(url)` | client-side route change |
| `getMountedPage()` | currently mounted page name |
| `getRoutePage()` | page name for current route |
| `getConfig` / `setConfig(key, value)` | read/write config |
| `showModal(id)` | open a modal by `ModalId` |
| `restart()` | restart the typing test |
| `signals(filter?)` | list tracked Solid signals `{name, source, value}`, filter by name/source substring |
| `getSignal(name)` / `setSignal(name, value)` | read/write a tracked signal by exact name |

Use these instead of `import("/node_modules/...")` from the page — Vite dep paths don't resolve from injected scripts.

Older globals from `frontend/src/ts/index.ts` (`addToGlobal`) also exist in all envs: `config`, `snapshot`, `qs`/`qsa`, `lastEventLog()`, `currentEventLog()`, `toggleDebugLogs()`.

## Console

`read_console_messages` with a `pattern` — logger output is noisy. Errors from `utils/logger.ts` are prefixed `ERR`.
