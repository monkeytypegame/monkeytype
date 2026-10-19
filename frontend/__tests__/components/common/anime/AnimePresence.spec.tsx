import { cleanup, render, screen } from "@solidjs/testing-library";
import { createSignal, JSXElement, Show } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";

type Running = { el: HTMLElement; opacity: number; finish: () => void };

// animations run until the test finishes them (zero duration ones, eg.
// initial states, finish at once). Like anime, a new animation on an element
// replaces its running one, which then never completes
const { running } = vi.hoisted(() => ({
  running: [] as Running[],
}));

vi.mock("animejs", () => ({
  animate: (el: HTMLElement, params: { opacity: number; duration: number }) => {
    const callbacks: Array<() => void> = [];
    let isDone = false;
    const done = (): void => {
      isDone = true;
      el.style.opacity = String(params.opacity);
      for (const callback of callbacks.splice(0)) callback();
    };
    const replaced = running.findIndex((animation) => animation.el === el);
    if (replaced !== -1) running.splice(replaced, 1);
    if (params.duration === 0) {
      done();
    } else {
      const animation: Running = {
        el,
        opacity: params.opacity,
        finish: () => {
          running.splice(running.indexOf(animation), 1);
          done();
        },
      };
      running.push(animation);
    }
    return {
      pause: () => {
        const index = running.findIndex((animation) => animation.el === el);
        if (index !== -1) running.splice(index, 1);
      },
      then: async (callback: () => void): Promise<void> => {
        if (isDone) callback();
        else callbacks.push(callback);
      },
    };
  },
}));

vi.mock("../../../../src/ts/utils/misc", () => ({
  applyReducedMotion: vi.fn((duration: number) => duration),
}));

import { Anime } from "../../../../src/ts/components/common/anime/Anime";
import { AnimePresence } from "../../../../src/ts/components/common/anime/AnimePresence";

async function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

/** Finishes the oldest running animation, returns its target opacity. */
function finish(): number {
  const animation = running[0];
  if (animation === undefined) throw new Error("no animation running");
  animation.finish();
  return animation.opacity;
}

/** Finishes animations (and lets new ones start) until none are left. */
async function settle(): Promise<void> {
  for (let i = 0; i < 20; i++) {
    await nextFrame();
    if (running.length === 0) return;
    while (running.length > 0) finish();
  }
  throw new Error("animations did not settle");
}

function childrenInDom(): string[] {
  return screen.queryAllByTestId("child").map((el) => el.textContent ?? "");
}

/** Like the page switcher: one keyed child at a time, fading out then in. */
function renderSwitcher(
  initial: string,
  content: (key: string) => JSXElement = (key) => key,
): (key: string) => void {
  const [key, setKey] = createSignal(initial);
  render(() => (
    <AnimePresence exitBeforeEnter>
      <Show when={key()} keyed>
        {(current) => (
          <Anime
            data-testid="child"
            data-name={current}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, duration: 125 }}
            exit={{ opacity: 0, duration: 125 }}
          >
            {content(current)}
          </Anime>
        )}
      </Show>
    </AnimePresence>
  ));
  return setKey;
}

describe("AnimePresence (exitBeforeEnter)", () => {
  afterEach(() => {
    cleanup();
    running.length = 0;
  });

  it("fades the old child out before the new one is in the DOM", async () => {
    const show = renderSwitcher("a");
    await settle();

    show("b");
    await nextFrame();
    expect(childrenInDom()).toEqual(["a"]);
    expect(finish()).toBe(0);

    expect(childrenInDom()).toEqual(["b"]);
    await nextFrame();
    expect(finish()).toBe(1);
    expect(running).toHaveLength(0);
  });

  it("holds the new child at its initial state until its fade in finishes", async () => {
    const show = renderSwitcher("a");
    await settle();

    show("b");
    await nextFrame();
    finish();

    const child = screen.getByTestId("child");
    expect(child.style.opacity).toBe("0");
    await nextFrame();
    expect(child.style.opacity).toBe("0");
    finish();
    expect(child.style.opacity).toBe("1");
  });

  it("ends on the last child after switching during the fade out", async () => {
    const show = renderSwitcher("a");
    await settle();

    show("b");
    show("c");
    show("d");
    await settle();

    expect(childrenInDom()).toEqual(["d"]);
    expect(screen.getByTestId("child").style.opacity).toBe("1");
  });

  it("ends on the last child after switching during the fade in", async () => {
    const show = renderSwitcher("a");
    await settle();

    show("b");
    await nextFrame();
    finish();
    await nextFrame();
    expect(running.map((animation) => animation.opacity)).toEqual([1]);

    show("c");
    await settle();
    expect(childrenInDom()).toEqual(["c"]);
    expect(screen.getByTestId("child").style.opacity).toBe("1");
  });

  it("ends on the last child when switching before the fade in starts", async () => {
    const show = renderSwitcher("a");
    await settle();

    show("b");
    await nextFrame();
    finish();
    // the fade in starts on the next frame - switch before it
    show("c");
    await settle();

    expect(childrenInDom()).toEqual(["c"]);
    expect(screen.getByTestId("child").style.opacity).toBe("1");
  });
});
