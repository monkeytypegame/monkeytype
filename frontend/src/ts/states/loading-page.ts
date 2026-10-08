import { createMemo } from "solid-js";

import { createSignalWithSetters } from "../hooks/createSignalWithSetters";
import { sleep } from "../utils/misc";
import { dispatchPageTransition } from "./router";

/** Which indicator the loading page shows while loading (a failed load shows the error instead). */
type LoadingIndicator = "spinner" | "bar";

/** Where the bar fill should animate to, and how long it should take getting there. */
type LoadingBarTarget = {
  percentage: number;
  durationMs: number;
};

type LoadingPageState = {
  indicator: LoadingIndicator;
  /** `null` hides the text line; an empty string shows it, holding its space. */
  text: string | null;
  barTarget: LoadingBarTarget | null;
};

const initialState: LoadingPageState = {
  indicator: "spinner",
  text: null,
  barTarget: null,
};

const [
  getState,
  { showLoadingPage, updateLoadingPageText, setBarTarget, set: setState },
] = createSignalWithSetters<LoadingPageState>(initialState)({
  showLoadingPage: (set, indicator: LoadingIndicator) =>
    set((prev) => ({ ...prev, indicator, text: null })),
  updateLoadingPageText: (set, text: string) =>
    set((prev) => ({ ...prev, text })),
  setBarTarget: (set, barTarget: LoadingBarTarget) =>
    set((prev) => ({ ...prev, barTarget })),
});

// memos rather than reading the state object directly, so that - for example -
// a text change doesn't make the bar effect re-run and restart its animation
export const getLoadingPageIndicator = createMemo(() => getState().indicator);
export const getLoadingPageText = createMemo(() => getState().text);
export const getLoadingPageBarTarget = createMemo(() => getState().barTarget);

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
  setBarTarget({ percentage, durationMs });
  await sleep(durationMs);
}

/**
 * Back to a fresh spinner with no text or bar target. Only needed to isolate
 * tests - in the app every load sets the state it needs before showing the page.
 */
export function resetLoadingPage(): void {
  setState(initialState);
}

/** Message for the error state, which the router enters when a route fails to load. */
export function setLoadingPageError(message: string): void {
  updateLoadingPageText(message);
}

type LoadingBarKeyframe = {
  /** Percentage of the bar to fill. */
  percentage: number;
  /** Duration in milliseconds for the keyframe animation. */
  durationMs: number;
  /** Text to display below the loading bar. */
  text?: string;
};

export type RouteLoading = {
  /** Evaluated before loading - the loading page is only shown when this is true. */
  shouldShow: () => boolean;
  load: () => Promise<void>;
} & (
  | { style: "spinner" }
  | {
      style: "bar";
      /** Shown in order while `load` runs. Cut short if `load` finishes first. */
      keyframes: LoadingBarKeyframe[];
    }
);

/**
 * Shows the loading page while `loading.load` runs. Throws on failure, so the
 * route fails and the router shows the error on the loading page.
 * @param label used in the error message, eg. "the account page"
 */
export async function withLoading(
  label: string,
  loading: RouteLoading,
): Promise<void> {
  if (!loading.shouldShow()) return;

  dispatchPageTransition({ type: "loadingShown" });
  showLoadingPage(loading.style);

  try {
    if (loading.style === "spinner") {
      await loading.load();
      return;
    }

    await updateLoadingPageBar(0, 0);
    updateLoadingPageText("");
    await loadWithKeyframes(loading.load(), loading.keyframes);
    void updateLoadingPageBar(100, 125);
    updateLoadingPageText("Done");
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
      if (keyframe.text !== undefined) updateLoadingPageText(keyframe.text);
      await updateLoadingPageBar(keyframe.percentage, keyframe.durationMs);
    }
  })();

  await Promise.race([
    keyframePromise,
    loadPromise.finally(() => (done = true)),
  ]);
  await loadPromise;
}
