// Test page bridge: what imperative test code needs from the Solid TestPage:
// whether the page is mounted and focus requests. All
// temporary: each item says when it goes.
import { createSignal, untrack } from "solid-js";

import { createEvent } from "../hooks/createEvent";

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

// Only TestPage and WordsInput use it now: moves into TestPage, for
// WordsInput's autofocus and the wrapper click (no roadmap row yet).
/**
 * Focuses the words input (WordsInput), then brings the test into view: the
 * active line during a test (Words), the test block before it (TestPage).
 * `force` blurs first.
 */
export const focusWordsEvent = createEvent<{ force: boolean }>();
