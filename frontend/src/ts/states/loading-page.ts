import { createSignal } from "solid-js";

import { sleep } from "../utils/misc";

/** Which indicator the loading page shows while loading (a failed load shows the error instead). */
type LoadingIndicator = "spinner" | "bar";

/** Where the bar fill should animate to, and how long it should take getting there. */
type LoadingBarTarget = {
  percentage: number;
  durationMs: number;
};

/** Shown from boot until the first route resolves, and while a blocking load runs. */
const [isLoadingPageShown, setLoadingPageShown] = createSignal(true);
export { isLoadingPageShown };

/** Called by the router once a route has resolved. */
export function hideLoadingPage(): void {
  setLoadingPageShown(false);
}

const initialIndicator: LoadingIndicator = "spinner";

export const [getLoadingPageIndicator, setLoadingPageIndicator] =
  createSignal<LoadingIndicator>(initialIndicator);
/** `null` hides the text line; an empty string shows it, holding its space. */
export const [getLoadingPageText, setLoadingPageText] = createSignal<
  string | null
>(null);
/** Where the current step's share of the bar starts: a loading page mounting mid-navigation starts its fill here. */
export const [getLoadingPageBarStart, setLoadingPageBarStart] = createSignal(0);
export const [getLoadingPageBarTarget, setLoadingPageBarTarget] =
  createSignal<LoadingBarTarget | null>(null);

/**
 * Points the bar fill at `percentage` and resolves after `durationMs`, so a
 * caller can sequence bar steps one after another. The wait is a plain timer
 * rather than the fill animation reporting back: the caller picked the duration,
 * and the bar is cosmetic, so there is nothing to gain from coupling the two.
 */
export async function updateLoadingPageBar(
  percentage: number,
  durationMs: number,
): Promise<void> {
  setLoadingPageBarTarget({ percentage, durationMs });
  await sleep(durationMs);
}

/**
 * Back to the boot state: shown, a fresh spinner with no text or bar target.
 * Only needed to isolate tests - in the app every load sets the state it
 * needs before showing the page.
 */
export function resetLoadingPage(): void {
  setLoadingPageShown(true);
  setLoadingPageIndicator(initialIndicator);
  setLoadingPageText(null);
  setLoadingPageBarStart(0);
  setLoadingPageBarTarget(null);
  barPlan = emptyPlan();
}

export type LoadingBarKeyframe = {
  /** Percentage of the bar to fill, out of 90 (the rest is "Done"). Scaled into the step's share of the bar. */
  percentage: number;
  /** Duration in milliseconds for the keyframe animation. */
  durationMs: number;
  /** Text to display below the loading bar. */
  text?: string;
};

/** A blocking load that shows the loading bar, eg. downloading results. */
export type LoadingStep = {
  /** Used in the error message, eg. "the account page". */
  label: string;
  /** Shown in order while the step runs. Cut short if the load finishes first. */
  keyframes: LoadingBarKeyframe[];
};

// one bar per navigation, split between its loading steps: each gets an equal
// share of 0-100, the last one stops at barEnd leaving the rest for "Done"
const barEnd = 90;

type BarPlan = {
  /** Loading steps planned at the start of the navigation. */
  steps: number;
  /** Loading steps finished so far. */
  done: number;
  /** Whether a step showed the bar this navigation. */
  shown: boolean;
};

function emptyPlan(): BarPlan {
  return { steps: 0, done: 0, shown: false };
}

let barPlan = emptyPlan();

/**
 * Called at the start of a navigation with how many loading steps it will
 * run, so they share one bar.
 */
export function planLoadingBar(steps: number): void {
  barPlan = { ...emptyPlan(), steps };
}

/**
 * Called once the navigation resolved: a bar shown this navigation completes
 * to "Done", even when a planned step was skipped.
 */
export function finishLoadingBar(): void {
  const { shown } = barPlan;
  barPlan = emptyPlan();
  if (!shown) return;
  void updateLoadingPageBar(100, 125);
  setLoadingPageText("Done");
}

/**
 * Shows the loading page while `load` runs, filling this step's share of the
 * navigation's bar (see planLoadingBar). Throws on failure, so the route fails
 * and the router shows the error on the loading page.
 */
export async function runLoadingStep(
  step: LoadingStep,
  load: () => Promise<void>,
): Promise<void> {
  // a step nobody planned for still gets a share of its own
  const steps = Math.max(barPlan.steps, barPlan.done + 1);
  const index = barPlan.done;
  const start = (index * 100) / steps;
  const end = index === steps - 1 ? barEnd : ((index + 1) * 100) / steps;
  barPlan.shown = true;

  setLoadingPageShown(true);
  setLoadingPageIndicator("bar");
  setLoadingPageText(null);
  setLoadingPageBarStart(start);

  await updateLoadingPageBar(start, 0);
  setLoadingPageText("");
  await failWithLabel(
    step.label,
    loadWithKeyframes(
      load(),
      step.keyframes.map((keyframe) => ({
        ...keyframe,
        percentage: start + (keyframe.percentage / barEnd) * (end - start),
      })),
    ),
  );
  barPlan.done++;
}

async function failWithLabel(
  label: string,
  load: Promise<void>,
): Promise<void> {
  try {
    await load;
  } catch (error) {
    throw new Error(
      `Failed to load ${label}: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }
}

async function loadWithKeyframes(
  loadPromise: Promise<void>,
  keyframes: LoadingBarKeyframe[],
): Promise<void> {
  let done = false;

  const keyframePromise = (async () => {
    for (const keyframe of keyframes) {
      if (done) break;
      if (keyframe.text !== undefined) setLoadingPageText(keyframe.text);
      await updateLoadingPageBar(keyframe.percentage, keyframe.durationMs);
    }
  })();

  await Promise.race([
    keyframePromise,
    loadPromise.finally(() => (done = true)),
  ]);
  await loadPromise;
}
