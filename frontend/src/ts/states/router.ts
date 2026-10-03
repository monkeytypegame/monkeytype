import { createSignal } from "solid-js";

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

/**
 * The page of the last resolved route ("loading" if loading failed). Changes
 * as soon as the route resolves - use it to react to navigation straight away.
 */
export const [getRoutePage, setRoutePage] = createSignal<PageName>("loading");

/**
 * The page currently on screen. Lags behind getRoutePage: it only changes once
 * the previous page has faded out and the next one is mounted, so the outgoing
 * page doesn't react to the navigation while it's still visible.
 * Is "loading" while the loading page is shown.
 */
export const [getActivePage, setActivePage] = createSignal<PageName>("loading");

/**
 * True while a route is loading and while the page fade is running
 * (including the initial load).
 */
export const [isPageTransitioning, setPageTransitioning] = createSignal(true);
