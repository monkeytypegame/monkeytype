// Fade requests: test-logic asks for a fade and awaits it, the component that
// renders the target runs the animation. Interim until fades follow the
// engine's phase (spec: "TestPage runs all fades").
import { createEvent } from "../hooks/createEvent";
import { applyReducedMotion } from "../utils/misc";

export type FadeTarget = "typingTest" | "result";

export type FadeRequest = {
  target: FadeTarget;
  direction: "in" | "out";
  duration: number;
  /** The listener running the fade hands its animation here. */
  waitFor: (animation: Promise<void>) => void;
};

const fadeEvent = createEvent<FadeRequest>();

/** Runs `listener` on each fade request until the owner cleans up. */
export const onFadeRequest = fadeEvent.useListener;

/**
 * Fades `target` in or out. Resolves when the animation ends, or at once
 * when nothing renders the target.
 */
export async function fadeTest(
  target: FadeTarget,
  direction: "in" | "out",
  noAnim: boolean,
): Promise<void> {
  const animations: Promise<void>[] = [];
  fadeEvent.dispatch({
    target,
    direction,
    duration: noAnim ? 0 : applyReducedMotion(125),
    waitFor: (animation) => animations.push(animation),
  });
  await Promise.all(animations);
}
