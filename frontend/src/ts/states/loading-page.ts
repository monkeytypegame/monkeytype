import { createSignal } from "solid-js";

import { sleep } from "../utils/misc";

/** Where the bar fill should animate to, and how long it should take getting there. */
type LoadingBarTarget = {
  percentage: number;
  durationMs: number;
};

/**
 * Whether the loading bar is up: from the first loading step of a navigation
 * until the bar finished at "Done" (see router/loading-bar.ts). The router can't
 * tell: this keeps the loading page up with the bar instead of the old page,
 * the new page or the slow navigation spinner.
 */
export const [isLoadingBarShown, setLoadingBarShown] = createSignal(false);

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
 * Back to the boot state: no bar, text or bar target.
 * Only needed to isolate tests - in the app every load sets the state it
 * needs before showing the page.
 */
export function resetLoadingPage(): void {
  setLoadingBarShown(false);
  setLoadingPageText(null);
  setLoadingPageBarStart(0);
  setLoadingPageBarTarget(null);
}
