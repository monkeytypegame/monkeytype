import type { StaticDataRouteOption } from "@tanstack/solid-router";

import { isConnectionsReady } from "../collections/connections";
import { isResultsReady } from "../collections/results";
import {
  LoadingStep,
  planLoadingBar,
  runLoadingStep,
} from "../states/loading-page";

/** A route's loading step: its bar setup and whether it has to run right now. */
type RouteLoadingStep = LoadingStep & {
  /** Read when the navigation starts (to plan the bar) and again when the step runs. */
  isNeeded: () => boolean;
};

const userDataStep: LoadingStep = {
  label: "user data",
  keyframes: [
    { percentage: 90, durationMs: 1000, text: "Downloading user data..." },
  ],
};

// the loading bar setup of every route with a loading step. A route names its
// step in `staticData.loadingStep` (the one place), its loader runs it with
// runRouteLoadingStep
const routeLoadingSteps = {
  results: {
    label: "the account page",
    isNeeded: () => !isResultsReady(),
    keyframes: [
      { percentage: 90, durationMs: 2000, text: "Downloading results..." },
    ],
  },
  friends: {
    label: "the friends page",
    isNeeded: () => !isConnectionsReady(),
    keyframes: [
      { percentage: 50, durationMs: 1500, text: "Downloading friends..." },
      {
        percentage: 50,
        durationMs: 1500,
        text: "Downloading friend requests...",
      },
    ],
  },
} satisfies Record<string, RouteLoadingStep>;

export type RouteLoadingStepName = keyof typeof routeLoadingSteps;

declare module "@tanstack/solid-router" {
  // oxlint-disable-next-line typescript/consistent-type-definitions -- module augmentation needs an interface
  interface StaticDataRouteOption {
    /** The route's loading step (see routeLoadingSteps), its loader runs it */
    loadingStep?: RouteLoadingStepName;
  }
}

/**
 * Plans the navigation's loading bar: the user data step if a download is
 * pending, plus each matched route whose loading step is needed right now.
 * Call at the start of a navigation, where all its matches are known.
 */
export function planNavigationLoadingBar(options: {
  matches: readonly { staticData: StaticDataRouteOption }[];
  userData: Promise<void> | undefined;
}): void {
  const routeSteps = options.matches.filter((match) => {
    const name = match.staticData.loadingStep;
    return name !== undefined && routeLoadingSteps[name].isNeeded();
  }).length;
  planLoadingBar((options.userData === undefined ? 0 : 1) + routeSteps);
}

/** Shows the loading bar while the user data downloads. */
export async function runUserDataStep(userData: Promise<void>): Promise<void> {
  await runLoadingStep(userDataStep, async () => userData);
}

/** The parts of a loader's context running its route's loading step needs. */
type LoadingStepLoaderContext = {
  preload: boolean;
  route: { options: { staticData?: StaticDataRouteOption } };
};

/**
 * Runs `load` as the loading step the loader's route names in
 * `staticData.loadingStep`, unless it's no longer needed. A preload (hovered
 * link) runs nothing: no loading page, the step runs once the page is opened.
 */
export async function runRouteLoadingStep(
  loader: LoadingStepLoaderContext,
  load: () => Promise<void>,
): Promise<void> {
  if (loader.preload) return;
  const name = loader.route.options.staticData?.loadingStep;
  if (name === undefined) {
    throw new Error(
      "A route running a loading step needs staticData.loadingStep",
    );
  }
  const step = routeLoadingSteps[name];
  if (!step.isNeeded()) return;
  await runLoadingStep(step, load);
}
