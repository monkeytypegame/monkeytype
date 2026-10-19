// createAppRouter: router options and the behaviour every router needs, the
// app's and the tests' (navigation blocker, guards re-run on auth change,
// loading bar)

import { createRouter, RouterHistory } from "@tanstack/solid-router";

import { isLoadingBarShown } from "../states/loading-page";
import { showNoticeNotification } from "../states/notifications";
import { getRoutePage } from "../states/router";
import {
  isResultCalculating,
  isTestActive,
  isTestRestarting,
} from "../states/test";
import { isFunboxActive } from "../test/funbox/list";
import { leaveTestPage } from "../test/test-logic";
import { finishLoadingBar } from "./loading-bar";
import { type RouterContext, routeTree } from "./routes";
import { parseSearch, stringifySearch } from "./search-params";
import { createNonRouterPage } from "../components/core/Page";
import { NotFoundPage } from "../components/pages/404Page";
import { LoadingErrorPage } from "../components/pages/LoadingErrorPage";

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
 * router/app-router.ts). Tests build one with a test context and
 * in-memory history (see __tests__/__harness__/app-shell.tsx).
 */
// oxlint-disable-next-line typescript/explicit-function-return-type -- the router type is inferred from the route tree
export function createAppRouter(
  context: RouterContext,
  options: { history?: RouterHistory } = {},
) {
  const router = createRouter({
    routeTree,
    context,
    history: options.history,
    defaultPreload: INTENT_PRELOADING ? "intent" : false,
    // a preloaded page's loaders run again when it's opened, and the
    // navigation waits for them: a preload skips the loading steps, so a
    // background reload (the default) would show the page before its data
    defaultPreloadStaleTime: 0,
    defaultStaleReloadMode: "blocking",
    // safety net for an unexpectedly slow navigation (loading steps show the
    // bar straight away): the loading page with a spinner after half a
    // second, kept at least half a second so it doesn't flash. PageSwitcher
    // shows it (isPendingShown). The pending component renders nothing, but
    // must be set: without one the router never marks a match pending
    defaultPendingComponent: () => null,
    defaultPendingMs: 500,
    defaultPendingMinMs: 500,
    // a failed load shows its error on the loading page, with a Retry button
    defaultErrorComponent: createNonRouterPage("loading", LoadingErrorPage),
    // unknown urls (the root route renders it, see notFoundMode). The profile
    // page shows its own message for unknown users
    defaultNotFoundComponent: createNonRouterPage("404", NotFoundPage),
    notFoundMode: "root",
    trailingSlash: "never",
    parseSearch,
    stringifySearch,
  });

  const preloadRoute = router.preloadRoute;
  router.preloadRoute = async (preloadOptions) =>
    isPreloadingPaused ? undefined : preloadRoute(preloadOptions);

  // guards every navigation - links, navigate(), back/forward.
  // redirects bypass it (ignoreBlocker); invalidate() (auth change, Retry)
  // doesn't go through history
  router.history.block({
    enableBeforeUnload: false,
    blockerFn: ({ nextLocation }) => {
      // a blocking load (user data, results, friends) holds the loading bar
      // up until "Done": the user waits for it. The slow navigation spinner
      // and the error page don't block
      if (isLoadingBarShown()) {
        console.debug(
          `navigation to ${nextLocation.href} blocked, the loading bar is shown`,
        );
        return true;
      }
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
  // waits for the first auth state itself (the userData route's beforeLoad)
  context.auth.onChange(() => void router.invalidate());

  // the loads are done: the bar fills up to "Done", then the loading page
  // hides (see PageSwitcher)
  router.subscribe("onLoad", () => {
    finishLoadingBar({
      failed: router.state.matches.some((match) => match.status === "error"),
    });
  });

  // leaving the test page ends the test as soon as the navigation starts, so
  // keystrokes while the page fades out don't count. Navigations the history
  // blocker stopped never get here
  router.subscribe("onBeforeNavigate", ({ pathChanged }) => {
    if (!pathChanged || getRoutePage() !== "test") return;
    leaveTestPage();
  });

  return router;
}

export type AppRouter = ReturnType<typeof createAppRouter>;
