// Test page bridge: what imperative test code needs from the Solid TestPage:
// whether the page is mounted. Temporary: it says when it goes.
import { createSignal, untrack } from "solid-js";

// Removed once test-logic stops asking (no roadmap row yet): its restart
// guard, the funbox activation check, the config event subscriber (C4).

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
