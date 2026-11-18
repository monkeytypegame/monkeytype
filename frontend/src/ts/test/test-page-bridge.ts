// Test page bridge: what imperative test code needs from the Solid TestPage:
// whether a test may start, whether the page is mounted, and its fades. The
// mount tracking and fades are temporary: remove the mount tracking once no
// imperative code needs to know, the fades once they follow the engine's
// phase (spec: "TestPage runs all fades").
import { createSignal, untrack } from "solid-js";

import { getRoutePage, isLeavingPage } from "../states/router";
import { applyReducedMotion } from "../utils/misc";

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
