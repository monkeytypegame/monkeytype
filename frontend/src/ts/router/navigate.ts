import { createSignal } from "solid-js";

// type-only: importing the router at runtime would be circular
import type { router } from "./index";

// set by router/index.ts - kept separate so vanilla modules can navigate and
// read router state without importing the route tree. router.state is
// reactive (backed by solid signals)
export const [getRouter, setRouter] = createSignal<typeof router>();

/**
 * Typed navigation to internal routes: `navigate({ to, params, search })`.
 * External links use plain urls instead.
 * Navigation guards live in the router's history blocker (router/index.ts).
 */
export const navigate: (typeof router)["navigate"] = async (options) => {
  const router = getRouter();
  if (router === undefined) {
    console.error("navigate ignored, router not initialised", options);
    return;
  }
  await router.navigate(options);
};

/**
 * Replace the search params of the current url without adding a history entry.
 * Does nothing while navigating to another path, or if nothing changed - the
 * route reloads on every url change. Use createSearchState (search-params.ts)
 * rather than calling this directly.
 */
export function replaceSearch(search: URLSearchParams): void {
  const router = getRouter();
  if (router === undefined) {
    console.error("replaceSearch ignored, router not initialised");
    return;
  }
  const { location, resolvedLocation } = router.state;
  if (location.pathname !== resolvedLocation?.pathname) return;
  const pathname = location.pathname;
  const query = search.toString();
  const url = `${pathname}${query === "" ? "" : `?${query}`}`;
  if (url === pathname + window.location.search) return;
  void router.navigate({
    href: url,
    replace: true,
    resetScroll: false,
    ignoreBlocker: true,
  });
}
