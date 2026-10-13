import { createRouter, RouterHistory } from "@tanstack/solid-router";

import { hideLoadingPage } from "../states/loading-page";
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
 * The app's router, minus the app-only side effects (title, focus, ads - see
 * router/index.ts). Tests build one with a test context and
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
    // a failed load shows its error on the loading page (see RootLayout)
    defaultErrorComponent: () => null,
    trailingSlash: "never",
    // keep search params as plain strings - routes parse them with zod themselves,
    // and existing links (eg. ?mode2=15) must keep their format
    parseSearch: (searchStr) =>
      Object.fromEntries(new URLSearchParams(searchStr)),
    stringifySearch: (search) => {
      const str = new URLSearchParams(
        search as Record<string, string>,
      ).toString();
      return str === "" ? "" : `?${str}`;
    },
  });

  // guards every navigation - links, navigate(), back/forward.
  // redirects and replaceSearch bypass it (ignoreBlocker)
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

  // leaving the test page ends the test as soon as the navigation starts, so
  // keystrokes while the page fades out don't count. Navigations the history
  // blocker stopped never get here
  router.subscribe("onBeforeNavigate", ({ pathChanged }) => {
    if (!pathChanged || getRoutePage() !== "test") return;
    leaveTestPage();
  });

  router.subscribe("onResolved", () => {
    hideLoadingPage();
  });

  return router;
}

export type AppRouter = ReturnType<typeof createAppRouter>;
