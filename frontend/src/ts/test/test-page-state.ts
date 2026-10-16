// Temporary: bridges imperative test code and the Solid TestPage. Remove once
// no imperative code needs to know whether the test page is mounted.
import { createSignal, untrack } from "solid-js";

// the current mount's signal - a remount can register before the old one aborts
const [getMountSignal, setMountSignal] = createSignal<AbortSignal>();
let leaving = false;

/** Call when the test page mounts. It counts as unmounted once `signal` aborts. */
export function markTestPageMounted(signal: AbortSignal): void {
  setMountSignal(signal);
  leaving = false;
  signal.addEventListener("abort", () => {
    if (untrack(getMountSignal) === signal) setMountSignal(undefined);
  });
}

/** Call when a navigation away from the test page starts. */
export function markTestPageLeaving(): void {
  leaving = true;
}

/** Whether the test page is mounted. Reactive. */
export function isTestPageMounted(): boolean {
  return getMountSignal() !== undefined;
}

/** A test can only start on the mounted test page, not while it fades out. */
export function canStartTest(): boolean {
  return untrack(isTestPageMounted) && !leaving;
}
