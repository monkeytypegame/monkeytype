import { createMemo } from "solid-js";

import { createSignalWithSetters } from "../hooks/createSignalWithSetters";
import { sleep } from "../utils/misc";

/** Which indicator the loading page is currently showing. */
type LoadingIndicator = "spinner" | "bar" | "error";

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
  {
    showLoadingPageSpinner,
    showLoadingPageError,
    showLoadingPageBar,
    updateLoadingPageText,
    setBarTarget,
    set: setState,
  },
] = createSignalWithSetters<LoadingPageState>(initialState)({
  showLoadingPageSpinner: (set) =>
    set((prev) => ({ ...prev, indicator: "spinner", text: null })),
  showLoadingPageError: (set) =>
    set((prev) => ({ ...prev, indicator: "error", text: null })),
  showLoadingPageBar: (set) =>
    set((prev) => ({ ...prev, indicator: "bar", text: null })),
  updateLoadingPageText: (set, text: string) =>
    set((prev) => ({ ...prev, text })),
  setBarTarget: (set, barTarget: LoadingBarTarget) =>
    set((prev) => ({ ...prev, barTarget })),
});

export {
  showLoadingPageBar,
  showLoadingPageError,
  showLoadingPageSpinner,
  updateLoadingPageText,
};

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
