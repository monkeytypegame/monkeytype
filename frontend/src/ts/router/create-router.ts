import { createRouter, RouterHistory } from "@tanstack/solid-router";

import { LoadingErrorRoutePage } from "../components/pages/LoadingErrorRoutePage";
import { LoadingRoutePage } from "../components/pages/Page";
import { endLoadingBar, finishLoadingBar } from "../states/loading-page";
import { showNoticeNotification } from "../states/notifications";
import { getRoutePage } from "../states/router";
import {
  isResultCalculating,
  isTestActive,
  isTestRestarting,
} from "../states/test";
import { isFunboxActive } from "../test/funbox/list";
import { leaveTestPage } from "../test/test-logic";
import type { RouterContext } from "./context";
import { routeTree } from "./routes";

/**
 * Hovering (or focusing) a link preloads its page: guards and loaders run
 * with `preload: true`, so they must not show the loading page or change
 * global state then. Flip to false to rule preloading out while debugging
 * (or toggle it at runtime with `__mt.setPreloading` in dev).
 */
const INTENT_PRELOADING = true;

// runtime switch (dev debug handle). Links read the router's preload option
// once, so the switch gates the preloads themselves
let isPreloadingPaused = false;

/** Turns preloading off or back on without a rebuild (dev debug handle). */
export function setPreloading(enabled: boolean): void {
  isPreloadingPaused = !enabled;
}

/**
 * The app's router, minus the app-only side effects (title, focus, ads - see
 * router/index.ts). Tests build one with a test context and
 * in-memory history (see __tests__/__harness__/app-shell.tsx).
 */
// oxlint-disable-next-line typescript/explicit-function-return-type -- the router type is inferred from the route tree
export function createAppRouter(
  context: RouterContext,
  options: { history?: RouterHistory; preload?: boolean } = {},
) {
  const router = createRouter({
    routeTree,
    context,
    history: options.history,
    defaultPreload: (options.preload ?? INTENT_PRELOADING) ? "intent" : false,
    // a preloaded page's loaders run again when it's opened
    defaultPreloadStaleTime: 0,
    // safety net for an unexpectedly slow navigation (loading steps show the
    // bar straight away): the loading page with a spinner after half a
    // second, kept at least half a second so it doesn't flash
    defaultPendingComponent: LoadingRoutePage,
    defaultPendingMs: 500,
    defaultPendingMinMs: 500,
    // a failed load shows its error on the loading page, with a Retry button
    defaultErrorComponent: LoadingErrorRoutePage,
    notFoundMode: "root",
    trailingSlash: "never",
    // search params are plain strings (the default JSON parser would turn
    // ?mode2=15 into a number) - route validateSearch schemas take strings in
    parseSearch: (searchStr) =>
      Object.fromEntries(new URLSearchParams(searchStr)),
    stringifySearch: (search) => {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(search)) {
        const str = searchValueToString(value);
        if (str !== undefined) params.set(key, str);
      }
      const str = params.toString();
      return str === "" ? "" : `?${str}`;
    },
  });

  const preloadRoute = router.preloadRoute;
  router.preloadRoute = async (preloadOptions) =>
    isPreloadingPaused ? undefined : preloadRoute(preloadOptions);

  // guards every navigation - links, navigate(), back/forward.
  // redirects bypass it (ignoreBlocker)
  router.history.block({
    enableBeforeUnload: false,
    blockerFn: ({ nextLocation }) => {
      if (isTestRestarting() || isResultCalculating()) {
        console.debug(
          `navigation to ${nextLocation.href} blocked, page is busy (testRestarting: ${isTestRestarting()}, resultCalculating: ${isResultCalculating()})`,
        );
        return true;
      }
      if (isTestActive() && isFunboxActive("no_quit")) {
        showNoticeNotification(
          "No quit funbox is active. Please finish the test.",
          { important: true },
        );
        return true;
      }
      return false;
    },
  });

  // re-run guards and loaders when the user signs in or out. The initial load
  // waits for the first auth state itself (the app route's beforeLoad)
  context.auth.onChange(() => void router.invalidate());

  // the loading page stops updating once hidden (router idle, after
  // onResolved), so its bar completes when the loads are done
  router.subscribe("onLoad", () => {
    finishLoadingBar();
  });

  // leaving the test page ends the test as soon as the navigation starts, so
  // keystrokes while the page fades out don't count. Navigations the history
  // blocker stopped never get here
  router.subscribe("onBeforeNavigate", ({ pathChanged }) => {
    if (!pathChanged || getRoutePage() !== "test") return;
    leaveTestPage();
  });

  // the router is idle: the loading page hides (see RootLayout)
  router.subscribe("onResolved", () => {
    endLoadingBar();
  });

  return router;
}

export type AppRouter = ReturnType<typeof createAppRouter>;

// booleans keep the "t"/"f" format of existing links, undefined is left out
function searchValueToString(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "boolean") return value ? "t" : "f";
  if (typeof value === "string") return value;
  if (typeof value === "number") return value.toString();
  return JSON.stringify(value);
}
