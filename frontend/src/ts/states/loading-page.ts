import { createSignal } from "solid-js";

import { sleep } from "../utils/misc";

/** Which indicator the loading page shows while loading (a failed load shows the error instead). */
type LoadingIndicator = "spinner" | "bar";

/** Where the bar fill should animate to, and how long it should take getting there. */
type LoadingBarTarget = {
  percentage: number;
  durationMs: number;
};

/** Shown from boot until the first route resolves, and while withLoading runs. */
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
  setLoadingPageBarTarget(null);
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
  setLoadingPageShown(true);
  setLoadingPageIndicator(loading.style);
  setLoadingPageText(null);

  try {
    if (loading.style === "spinner") {
      await loading.load();
      return;
    }

    await updateLoadingPageBar(0, 0);
    setLoadingPageText("");
    await loadWithKeyframes(loading.load(), loading.keyframes);
    void updateLoadingPageBar(100, 125);
    setLoadingPageText("Done");
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
