import { createMemo, createSignal } from "solid-js";

import {
  initialPageTransitionState,
  PageTransitionEvent,
  transitionPage,
} from "../router/page-transition";

export type PageName =
  | "loading"
  | "test"
  | "settings"
  | "about"
  | "account"
  | "login"
  | "profile"
  | "profileSearch"
  | "404"
  | "accountSettings"
  | "leaderboards"
  | "friends";

const [getState, setState] = createSignal(initialPageTransitionState);

/** Feeds the router, the loading page and the page fade into the transition (see router/page-transition.ts). */
export function dispatchPageTransition(event: PageTransitionEvent): void {
  setState((state) => transitionPage(state, event));
}

/**
 * The page of the last resolved route ("loading" if loading failed). Changes
 * as soon as the route resolves - use it to react to navigation straight away.
 */
export const getRoutePage = createMemo(() => getState().routePage);

/**
 * The page currently on screen. Lags behind getRoutePage: it only changes once
 * the previous page has faded out and the next one is mounted, so the outgoing
 * page doesn't react to the navigation while it's still visible.
 * Is "loading" while the loading page is shown.
 */
export const getActivePage = createMemo(() => getState().mountedPage);

/** Whether the test page is on screen (see getActivePage). */
export const isTestPageActive = createMemo(() => getActivePage() === "test");

/**
 * True while a route is loading and while the page fade is running
 * (including the initial load).
 */
export const isPageTransitioning = createMemo(() => getState().transitioning);

/** Whether the loading page covers the route. "error" stays until the next navigation. */
export const getLoadingScreen = createMemo(() => getState().loadingScreen);

export const getPageFadePhase = createMemo(() => getState().fadePhase);
