import type { AnyRouter } from "@tanstack/solid-router";

import { isPageTransitioning } from "../states/router";
import { showNoticeNotification } from "../states/notifications";
import {
  isResultCalculating,
  isTestActive,
  isTestRestarting,
} from "../states/test";
import { isFunboxActive } from "../test/funbox/list";

// set by router/index.ts - kept separate so vanilla modules can navigate
// without importing the route tree
let router: AnyRouter | undefined;

export function setRouter(r: AnyRouter): void {
  router = r;
}

export type NavigateOptions = {
  /** Navigate even if a test is restarting, a result is calculating or a page is transitioning. */
  force?: boolean;
};

/**
 * @param url path (optionally with search and hash) or full url on this origin
 */
export async function navigate(
  url: string,
  options: NavigateOptions = {},
): Promise<void> {
  if (router === undefined) {
    console.error(`navigate: ${url} ignored, router not initialised`);
    return;
  }

  if (
    !options.force &&
    (isTestRestarting() || isResultCalculating() || isPageTransitioning())
  ) {
    console.debug(
      `navigate: ${url} ignored, page is busy (testRestarting: ${isTestRestarting()}, resultCalculating: ${isResultCalculating()}, pageTransition: ${isPageTransitioning()})`,
    );
    return;
  }

  if (isTestActive() && isFunboxActive("no_quit")) {
    showNoticeNotification(
      "No quit funbox is active. Please finish the test.",
      { important: true },
    );
    return;
  }

  // trailing slashes are stripped by the router (`trailingSlash: "never"`)
  const target = new URL(url, window.location.origin);
  await router.navigate({
    href: target.pathname + target.search + target.hash,
  });
}

/**
 * Replace the search params of the current url without adding a history entry.
 * Does nothing while navigating to another path, or if nothing changed - the
 * route reloads on every url change. Use createSearchParams (search-params.ts)
 * rather than calling this directly.
 */
export function replaceSearch(search: URLSearchParams): void {
  if (router === undefined) return;
  const { location, resolvedLocation } = router.state;
  if (location.pathname !== resolvedLocation?.pathname) return;
  const pathname = location.pathname;
  const query = search.toString();
  const url = `${pathname}${query === "" ? "" : `?${query}`}`;
  if (url === pathname + window.location.search) return;
  void router.navigate({ href: url, replace: true, resetScroll: false });
}
