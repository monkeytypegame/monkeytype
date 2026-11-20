// Test page bridge: what imperative test code needs from the Solid TestPage:
// whether the page is mounted, its finish fade and focus requests. All
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

// T6c: removed. The finish fade-out follows the phase in TestPage, which runs
// all the other fades itself; finish() awaits this one until then.
let finishFadeOut: ((duration: number) => Promise<void>) | undefined;

/** TestPage: registers the words' fade-out on finish. Returns the unregister function. */
export function registerFinishFadeOut(
  fade: (duration: number) => Promise<void>,
): () => void {
  finishFadeOut = fade;
  return () => {
    if (finishFadeOut === fade) finishFadeOut = undefined;
  };
}

/** Fades the words out on finish; resolves at once when TestPage isn't mounted. */
export async function fadeOutForFinish(): Promise<void> {
  await finishFadeOut?.(applyReducedMotion(125));
}

// Only TestPage and WordsInput use it now: moves into TestPage, for
// WordsInput's autofocus and the wrapper click (no roadmap row yet).
/**
 * Focuses the words input (WordsInput), then brings the test into view: the
 * active line during a test (Words), the test block before it (TestPage).
 * `force` blurs first.
 */
export const focusWordsEvent = createEvent<{ force: boolean }>();
