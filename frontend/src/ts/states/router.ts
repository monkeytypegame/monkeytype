import { createMemo, createSignal } from "solid-js";

import type { PageName } from "../components/pages/Pages";

export type { PageName };

/** The page of the last resolved route ("loading" if loading failed). */
export const [getRoutePage, setRoutePage] = createSignal<PageName>("loading");

/** True from the start of a path change until its route resolves. */
export const [isRouteLoading, setRouteLoading] = createSignal(true);

/** Set by withLoading when a route loader needs the loading page. */
export const [isLoadingPageShown, setLoadingPageShown] = createSignal(true);

/** Why the last route failed to load, shown on the loading page until the next navigation. */
export const [getLoadingError, setLoadingError] = createSignal<string | null>(
  null,
);

/**
 * The page currently on screen. Lags behind getTargetPage: it only changes
 * once the previous page has faded out (see Pages.tsx).
 */
export const [getMountedPage, setMountedPage] =
  createSignal<PageName>("loading");

/** True while the mounted page is fading out or in. */
export const [isPageFading, setPageFading] = createSignal(true);

/** The page that should be on screen - the loading page covers the route while it loads. */
export const getTargetPage = createMemo(() =>
  isLoadingPageShown() || getLoadingError() !== null
    ? "loading"
    : getRoutePage(),
);

export const isTestPageActive = createMemo(() => getMountedPage() === "test");

/** True while a route is loading and while the page fade is running. */
export const isPageTransitioning = (): boolean =>
  isRouteLoading() || isPageFading();
