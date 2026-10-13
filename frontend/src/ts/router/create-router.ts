import { createRouter, RouterHistory } from "@tanstack/solid-router";

import { LoadingErrorRoutePage } from "../components/pages/LoadingErrorRoutePage";
import { hideLoadingPage } from "../states/loading-page";
import type { RouterContext } from "./context";
import { routeTree } from "./routes";

/**
 * The app's router, minus the app-only side effects (history blocker, title,
 * focus, ads - see router/index.ts). Tests build one with a test context and
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
    // a failed load shows its error on the loading page, with a Retry button
    defaultErrorComponent: LoadingErrorRoutePage,
    notFoundMode: "root",
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

  // re-run guards and loaders when the user signs in or out. The initial load
  // waits for the first auth state itself (the app route's beforeLoad)
  context.auth.onChange(() => void router.invalidate());

  router.subscribe("onResolved", () => {
    hideLoadingPage();
  });

  return router;
}

export type AppRouter = ReturnType<typeof createAppRouter>;
