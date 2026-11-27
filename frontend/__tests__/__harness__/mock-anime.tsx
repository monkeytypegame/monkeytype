// Controllable anime for specs: importing it mocks anime (vitest hoists the
// vi.mock calls, so import order doesn't matter). Animations run until the
// spec finishes them (`finish`, `settle`); non-zero ones are logged
// (`animate <data-name> to <opacity>`) in `log`, which specs may push to
// too, to order their own events against the animations.
import { screen } from "@solidjs/testing-library";
import { JSXElement } from "solid-js";
import { vi } from "vitest";

import { Anime } from "../../src/ts/components/common/anime/Anime";

type Running = { el: HTMLElement; opacity: number; finish: () => void };

// animations run until the test finishes them (zero duration ones, eg.
// initial states, finish at once). Like anime, a new animation on an element
// replaces its running one, which then never completes
const { running, log } = vi.hoisted(() => ({
  running: [] as Running[],
  log: [] as string[],
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
      log.push(`animate ${el.dataset["name"]} to ${params.opacity}`);
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

vi.mock("../../src/ts/utils/misc", async (importOriginal) => ({
  ...(await importOriginal()),
  applyReducedMotion: vi.fn((duration: number) => duration),
}));

export { log, running };

/** Clears running animations and the log, for afterEach. */
export function resetAnimations(): void {
  running.length = 0;
  log.length = 0;
}

export async function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

/** Finishes the oldest running animation, returns its target opacity. */
export function finish(): number {
  const animation = running[0];
  if (animation === undefined) throw new Error("no animation running");
  animation.finish();
  return animation.opacity;
}

/** Finishes animations (and lets new ones start) until none are left. */
export async function settle(): Promise<void> {
  for (let i = 0; i < 20; i++) {
    await nextFrame();
    if (running.length === 0) return;
    while (running.length > 0) finish();
  }
  throw new Error("animations did not settle");
}

export function childrenInDom(): string[] {
  return screen.queryAllByTestId("child").map((el) => el.textContent ?? "");
}

/** A child fading in, and out on exit. */
export function Child(props: {
  name: string;
  children: JSXElement;
}): JSXElement {
  return (
    <Anime
      data-testid="child"
      data-name={props.name}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, duration: 125 }}
      exit={{ opacity: 0, duration: 125 }}
    >
      {props.children}
    </Anime>
  );
}
