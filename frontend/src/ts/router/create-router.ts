import { createRouter, RouterHistory } from "@tanstack/solid-router";

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
    // pages are rendered by <Pages>, a failed load shows its error on the loading page
    defaultErrorComponent: () => null,
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

  // re-run guards and loaders when the user signs in or out. The initial load
  // waits for the first auth state itself (the app route's beforeLoad)
  context.auth.onChange(() => void router.invalidate());

  router.subscribe("onResolved", () => {
    hideLoadingPage();
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
