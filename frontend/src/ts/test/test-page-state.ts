// Test page state: whether a test may start, and whether the page is mounted.
// The mount tracking is temporary: it bridges imperative test code and the
// Solid TestPage. Remove it once no imperative code needs to know.
import { createSignal, untrack } from "solid-js";

import { getRoutePage, isLeavingPage } from "../states/router";

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

/**
 * Whether typing may start a test: the test page is shown, and no
 * navigation is leaving it (eg. typing while it fades out). A reload in
 * place (eg. signing in) doesn't stop it.
 */
export function canStartTest(): boolean {
  return getRoutePage() === "test" && !isLeavingPage();
}
