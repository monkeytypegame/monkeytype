import type { AnyRouter } from "@tanstack/solid-router";

// set by router/index.ts - kept separate so vanilla modules can navigate
// without importing the route tree
let router: AnyRouter | undefined;

export function setRouter(r: AnyRouter): void {
  router = r;
}

/**
 * Navigation guards live in the router's history blocker (router/index.ts).
 * @param url path (optionally with search and hash) or full url on this origin
 */
export async function navigate(url: string): Promise<void> {
  if (router === undefined) {
    console.error(`navigate: ${url} ignored, router not initialised`);
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
  void router.navigate({
    href: url,
    replace: true,
    resetScroll: false,
    ignoreBlocker: true,
  });
}
