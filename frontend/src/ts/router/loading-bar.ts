// The navigation's loading bar: one bar split between the loading steps of a
// navigation, filled while each step runs, finished at "Done". The loading
// page renders it from the state in states/loading-page.ts

import {
  isLoadingBarShown,
  resetLoadingPage,
  setLoadingBarShown,
  setLoadingPageBarStart,
  setLoadingPageText,
  updateLoadingPageBar,
} from "../states/loading-page";

// the "Done" fill that hides the bar once finished. A loading step starting
// meanwhile cancels the hide
let finishing: object | undefined;

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
};

function emptyPlan(): BarPlan {
  return { steps: 0, done: 0 };
}

let barPlan = emptyPlan();

/**
 * Back to the boot state: no bar, plan, text or bar target.
 * Only needed to isolate tests.
 */
export function resetLoadingBar(): void {
  resetLoadingPage();
  barPlan = emptyPlan();
  finishing = undefined;
}

/**
 * Called at the start of a navigation with how many loading steps it will
 * run, so they share one bar.
 */
export function planLoadingBar(steps: number): void {
  barPlan = { ...emptyPlan(), steps };
}

/**
 * Called once the navigation loaded: a bar shown this navigation completes
 * to "Done", even when a planned step was skipped, then hides. A failed
 * navigation hides it at once (its error shows instead).
 */
export function finishLoadingBar(options: { failed: boolean }): void {
  barPlan = emptyPlan();
  if (!isLoadingBarShown()) return;
  if (options.failed) {
    finishing = undefined;
    setLoadingBarShown(false);
    return;
  }

  const finish = {};
  finishing = finish;
  setLoadingPageText("Done");
  void updateLoadingPageBar(100, 125).then(() => {
    if (finishing !== finish) return;
    finishing = undefined;
    setLoadingBarShown(false);
  });
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

  finishing = undefined;
  setLoadingBarShown(true);
  // the step's text straight away: hiding the line, even for a frame, moves
  // the centered bar
  setLoadingPageText(
    step.keyframes.find((keyframe) => keyframe.text !== undefined)?.text ?? "",
  );
  setLoadingPageBarStart(start);

  await updateLoadingPageBar(start, 0);
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

/** A loading step's failure: its message says what failed to load. */
export class LoadingStepError extends Error {}

async function failWithLabel(
  label: string,
  load: Promise<void>,
): Promise<void> {
  try {
    await load;
  } catch (error) {
    throw new LoadingStepError(
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
