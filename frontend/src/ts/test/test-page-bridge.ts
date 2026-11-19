// Test page bridge: what imperative test code needs from the Solid TestPage:
// whether the page is mounted, its fades, focus requests and restarts. All
// temporary: each item says when it goes.
import { createSignal, untrack } from "solid-js";

import { createEvent } from "../hooks/createEvent";
import { applyReducedMotion } from "../utils/misc";

// Removed once test-logic stops asking (no roadmap row yet): its restart
// guard, the funbox activation check.

// the current mount's signal - a remount can register before the old one aborts
const [getMountSignal, setMountSignal] = createSignal<AbortSignal>();

/** Call when the test page mounts. It counts as unmounted once `signal` aborts. */
export function markTestPageMounted(signal: AbortSignal): void {
  setMountSignal(signal);
  signal.addEventListener("abort", () => {
    if (untrack(getMountSignal) === signal) setMountSignal(undefined);
  });
}

/** Whether the test page is mounted. Reactive. */
export function isTestPageMounted(): boolean {
  return getMountSignal() !== undefined;
}

// TestPage runs the restart fades itself, the engine never waits for them.
// T6c: the finish fade too, and this goes.
export type FadeTarget = "typingTest" | "result";

/** Animates the target's element; resolves when the animation ends. */
export type Fade = (direction: "in" | "out", duration: number) => Promise<void>;

const fades = new Map<FadeTarget, Fade>();

/** Registers the fade for `target`. Returns the unregister function. */
export function registerFade(target: FadeTarget, fade: Fade): () => void {
  fades.set(target, fade);
  return () => {
    if (fades.get(target) === fade) fades.delete(target);
  };
}

/**
 * Fades `target` in or out. Resolves when the animation ends, or at once
 * when nothing renders the target.
 */
export async function fadeTest(
  target: FadeTarget,
  direction: "in" | "out",
  noAnim: boolean,
): Promise<void> {
  await fades.get(target)?.(direction, noAnim ? 0 : applyReducedMotion(125));
}

// test-logic's dispatch goes once TestPage focuses on the restart's stage;
// the event then moves into TestPage, for WordsInput's autofocus and the
// wrapper click (no roadmap row yet).
/**
 * Focuses the words input (WordsInput), then brings the test into view: the
 * active line during a test (Words), the test block before it (TestPage).
 * `force` blurs first.
 */
export const focusWordsEvent = createEvent<{ force: boolean }>();

// Removed once listeners follow the engine's test id (no roadmap row yet).
/** Dispatched when TestPage swaps a restarted test in, with what it replaced. */
export const testRestartedEvent = createEvent<"testPage" | "resultPage">();
