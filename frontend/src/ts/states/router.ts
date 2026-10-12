import { createMemo, createSignal } from "solid-js";

import type { PageName } from "../components/pages/Pages";

export type { PageName };

/** The page of the last resolved route ("loading" if loading failed). */
export const [getRoutePage, setRoutePage] = createSignal<PageName>("loading");

/** Set by withLoading when a route loader needs the loading page. */
export const [isLoadingPageShown, setLoadingPageShown] = createSignal(true);

/** Why the last route failed to load, shown on the loading page until the next navigation. */
export const [getLoadingError, setLoadingError] = createSignal<string | null>(
  null,
);

/** The page that should be on screen - the loading page covers the route while it loads. */
export const getTargetPage = createMemo(() =>
  isLoadingPageShown() || getLoadingError() !== null
    ? "loading"
    : getRoutePage(),
);

/** Whether the test page is mounted. Set by TestPage. */
export const [isTestPageActive, setTestPageActive] = createSignal(false);
