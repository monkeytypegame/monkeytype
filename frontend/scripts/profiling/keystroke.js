// Keystroke profiling harness for production builds, see docs/PROFILING.md.
// Served from the build folder (scripts/profile-build.sh copies it there),
// loaded in the page with `await import("/keystroke.js")`.
//
// Latency runs from each key's scheduled time, not its dispatch time, so time
// spent queued behind earlier keys counts.

const CONFIG_KEY = "config";

/** Merges `patch` into the stored config, then reloads into a fresh test. */
function configure(patch) {
  const config = JSON.parse(localStorage.getItem(CONFIG_KEY) ?? "{}");
  Object.assign(config, patch);
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  setTimeout(() => location.reload(), 50);
  return config;
}

/** Resolves once the test has rendered words, plus a settle delay. */
async function waitForTest(settleMs = 2000) {
  for (let i = 0; i < 150; i++) {
    if (document.querySelector("#words > .word") !== null) break;
    await new Promise((r) => setTimeout(r, 200));
  }
  await new Promise((r) => setTimeout(r, settleMs));
}

function stats(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const at = (p) =>
    sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
  const round = (v) => +v.toFixed(1);
  return {
    mean: round(values.reduce((s, v) => s + v, 0) / values.length),
    p50: round(at(0.5)),
    p95: round(at(0.95)),
    max: round(sorted[sorted.length - 1]),
  };
}

/**
 * Types `chars` characters of the test text, one every `gapMs`, through the
 * real input handlers. The test only renders 100 words up front, so words
 * appended during the run are followed with a MutationObserver.
 */
async function run({ label, gapMs, chars }) {
  const input = document.querySelector("#wordsInput");
  const wordsEl = document.querySelector("#words");
  let text = [...wordsEl.querySelectorAll(":scope > .word")]
    .map((w) => w.textContent)
    .join(" ");
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node.nodeType === 1 && node.classList.contains("word")) {
          text += ` ${node.textContent}`;
        }
      }
    }
  });
  observer.observe(wordsEl, { childList: true });

  const handler = [];
  const queued = [];
  const latency = [];
  const frames = [];
  const unrendered = [];
  let typedSinceFrame = 0;
  let ranOut = 0;

  const typeChar = (index, due) => {
    const start = performance.now();
    queued.push(start - due);
    let ch = text[index];
    if (ch === undefined) {
      ranOut++;
      ch = "a";
    }
    typedSinceFrame++;
    input.focus();
    const before = new InputEvent("beforeinput", {
      inputType: "insertText",
      data: ch,
      bubbles: true,
      cancelable: true,
    });
    input.dispatchEvent(before);
    if (!before.defaultPrevented) {
      input.setRangeText(ch, input.selectionStart, input.selectionEnd, "end");
      input.dispatchEvent(
        new InputEvent("input", {
          inputType: "insertText",
          data: ch,
          bubbles: true,
        }),
      );
    }
    handler.push(performance.now() - start);
    unrendered.push(due);
  };

  // frame cost: frame start to a task that runs after rendering
  let running = true;
  let frameStart = 0;
  let keysInFrame = 0;
  let lastRender = 0;
  const channel = new MessageChannel();
  channel.port1.onmessage = () => {
    if (keysInFrame === 0) return;
    const now = performance.now();
    frames.push(now - frameStart);
    lastRender = now;
    for (const due of unrendered.splice(0)) latency.push(now - due);
  };
  const loop = () => {
    if (!running) return;
    frameStart = performance.now();
    keysInFrame = typedSinceFrame;
    typedSinceFrame = 0;
    channel.port2.postMessage(0);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  // every key scheduled up front: a busy main thread queues them
  const first = performance.now() + 100;
  await new Promise((done) => {
    for (let i = 0; i < chars; i++) {
      const due = first + i * gapMs;
      setTimeout(() => {
        typeChar(i, due);
        if (i === chars - 1) setTimeout(done, 1000);
      }, due - performance.now());
    }
  });
  running = false;
  observer.disconnect();

  return {
    label,
    gapMs,
    chars,
    ranOut,
    frames: frames.length,
    drainMs: Math.round(lastRender - first),
    idealDrainMs: (chars - 1) * gapMs,
    handler: stats(handler),
    queued: stats(queued),
    latency: stats(latency),
    frame: stats(frames),
  };
}

globalThis.__prof = { configure, waitForTest, run };
