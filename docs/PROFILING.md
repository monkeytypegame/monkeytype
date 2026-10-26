# Profiling (agents)

Compare **production builds**, measuring **full frames**. Both rules exist because the alternatives gave a wrong answer:

- **Dev builds** inflate Solid code only: Solid's dev runtime, `solid-devtools` (imported in `index.tsx`), solid-refresh wrappers and the devtools `autoname` transform. Vanilla code pays none of it. Profiler mode (`localStorage.profilerMode = "true"`, then reload) only turns off the signal tracker, sentry and debug logging. Use dev builds for *where* time goes, never for A/B verdicts.
- **Timing `requestAnimationFrame` callbacks** misses the browser's style, layout and paint, and microtasks queued from the callback (e.g. code after an `await`). A forced layout inside a callback shows up as callback time, while the same layout done by the browser after the frame doesn't: two versions can look 3× apart while costing the same.

## Build

```sh
scripts/profile-build.sh . frontend/dist-a                       # main checkout as it is
scripts/profile-build.sh origin/master frontend/dist-c           # any ref, in a temp worktree
scripts/profile-build.sh . frontend/dist-b variant-b.patch       # a variant: patch applied for the build only
```

Write a variant as a patch (`git diff > variant-b.patch`, then revert), so it rebuilds identically. The script copies the harness (`frontend/scripts/profiling/keystroke.js`) into each build. Keep the builds until the user ends the profiling session: each rebuild costs 1-2 minutes. Then delete the `dist-*` folders.

## Serve

```sh
lsof -iTCP:3011 -sTCP:LISTEN -P   # a port held by an earlier session fails `--strictPort`
pnpm vite preview --outDir "$PWD/dist-a" --port 3011 --strictPort   # from frontend/, run_in_background
```

Use one port per build, from 3011 up (3000-3002 are taken by dev servers). Stop servers started this session with `TaskStop`. The sandbox can't `kill` a server from an earlier session: ask the user to run `! kill <pid>`. If the sandbox refuses the port (`listen EPERM`), ask the user to run the preview commands with `!`.

## Measure

Production has no `window.__mt`. Each port is its own origin with its own localStorage, so configure every origin the same way. The harness (`globalThis.__prof`) loads with `await import("/keystroke.js")`:

```js
// once per origin: merges into the stored config and reloads
await import("/keystroke.js");
__prof.configure({ mode: "time", time: 120, tapeMode: "letter", smoothLineScroll: true });
```

```js
// one run per javascript_tool call
await import("/keystroke.js");
await __prof.waitForTest();
JSON.stringify(await __prof.run({ label: "A", gapMs: 48, chars: 300 }));
```

Put `location.reload()` in its own call between runs (a fresh test per run). A reload scheduled at the end of a run lands mid-way through the next call and kills it.

`run` types through the real input handlers on a fixed schedule, every key scheduled up front, so a busy main thread queues them like real input. It reports:

- `latency`: each key's scheduled time to the first frame rendered after it. Queueing counts, which is what separates builds once input piles up.
- `queued`, `handler`: scheduled-to-dispatch delay, and handler time per key.
- `frame`: frame start to a task that runs after rendering, keystroke frames only.
- `drainMs` vs `idealDrainMs`: how far the build fell behind the input.

Gaps: 48 ms is 250 wpm, 1 ms (12,000 wpm) is a saturation test. `javascript_tool` calls time out at 45 s: keep `gapMs × chars` under about 30 s, less under CPU throttling. CPU throttling is a DevTools setting the user sets; the extension can't.

Report mean, p50 and p95 over 3 runs per build, with the run-to-run spread: a difference smaller than the spread is no difference. Drop and rerun a cold first run after navigating if it sits far outside the rest. Compare against the frame budget (`1000 / refresh rate` ms).

## Where time goes

On the dev server, wrap suspect stages in temporary `performance.now()` markers, aggregated on `globalThis`. Put a forced layout (`void document.body.offsetHeight`) right before a stage that measures the DOM, timed as its own marker, so pending layout isn't blamed on that stage. Remove the markers before committing.
