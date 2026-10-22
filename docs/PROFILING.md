# Profiling (agents)

Compare **production builds**, measuring **full frames**. Both rules exist because the alternatives gave a wrong answer:

- **Dev builds** inflate Solid code only: Solid's dev runtime, `solid-devtools` (imported in `index.tsx`), solid-refresh wrappers and the devtools `autoname` transform. Vanilla code pays none of it. Profiler mode (`localStorage.profilerMode = "true"`, then reload) only turns off the signal tracker, sentry and debug logging. Use dev builds for *where* time goes, never for A/B verdicts.
- **Timing `requestAnimationFrame` callbacks** misses the browser's style, layout and paint, and microtasks queued from the callback (e.g. code after an `await`). A forced layout inside a callback shows up as callback time, while the same layout done by the browser after the frame doesn't: two versions can look 3× apart while costing the same.

## Build and serve

Vite's root is `frontend/src`, so pass an **absolute** `--outDir` (a relative one resolves under `src/`).

```sh
cd frontend
pnpm vite build --outDir "$PWD/dist-a"                  # current branch
# other branch: a worktree, set up with scripts/setup-worktree.sh, then
#   node_modules/.bin/vite build --outDir <absolute path>/dist-b
pnpm vite preview --outDir "$PWD/dist-a" --port 3001 --strictPort
pnpm vite preview --outDir "$PWD/dist-b" --port 3002 --strictPort
```

If the sandbox refuses the port (`listen EPERM`), ask the user to run the preview commands with `!`. Delete the `dist-*` folders afterwards.

## Configure

Production has no `window.__mt`. Each port is its own origin with its own localStorage: set the config there, then reload (a reload also starts a fresh test).

```js
const c = JSON.parse(localStorage.getItem("config"));
Object.assign(c, { mode: "time", time: 120, tapeMode: "word" });
localStorage.setItem("config", JSON.stringify(c));
location.reload();
```

## Measure

Type through the real handlers with paced synthetic events, and time each frame from its start to a task that runs after rendering. Keep only frames that follow a keystroke: idle frames dilute the difference.

```js
const el = document.querySelector("#wordsInput");
let typed = false;
const typeChar = (ch) => {
  typed = true;
  el.focus();
  const bi = new InputEvent("beforeinput", { inputType: "insertText", data: ch, bubbles: true, cancelable: true });
  el.dispatchEvent(bi);
  if (bi.defaultPrevented) return;
  el.setRangeText(ch, el.selectionStart, el.selectionEnd, "end");
  el.dispatchEvent(new InputEvent("input", { inputType: "insertText", data: ch, bubbles: true }));
};
const text = [...document.querySelectorAll("#words > .word")].map((w) => w.textContent).join(" ").slice(0, 250);
const costs = []; let running = true, t0 = 0, wasTyped = false;
const mc = new MessageChannel();
mc.port1.onmessage = () => { if (wasTyped) costs.push(performance.now() - t0); };
const loop = () => { if (!running) return; t0 = performance.now(); wasTyped = typed; typed = false; mc.port2.postMessage(0); requestAnimationFrame(loop); };
requestAnimationFrame(loop);
for (const ch of text) { typeChar(ch); await new Promise((r) => setTimeout(r, 60)); } // 60ms ≈ 200 wpm
running = false;
```

`javascript_tool` calls time out at 45s: run one measurement per call (250 characters at 60ms is ~16s), and keep results in localStorage across reloads.

Report mean, p50, p95 and p99 over 3 runs per build, with the run-to-run spread: a difference smaller than the spread is no difference. Compare against the frame budget (`1000 / refresh rate` ms).

## Where time goes

On the dev server, wrap suspect stages in temporary `performance.now()` markers, aggregated on `globalThis`. Put a forced layout (`void document.body.offsetHeight`) right before a stage that measures the DOM, timed as its own marker, so pending layout isn't blamed on that stage. Remove the markers before committing.
