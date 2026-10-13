import { createMemo } from "solid-js";

import { getRouter } from "../router/navigate";
import { isLoadingPageShown } from "./loading-page";

/** A page of the site, rendered by its route (see router/routes.ts). */
export type PageName =
  | "loading"
  | "test"
  | "about"
  | "settings"
  | "account"
  | "login"
  | "profile"
  | "profileSearch"
  | "404"
  | "accountSettings"
  | "friends"
  | "leaderboards";

// matches only change once a route has loaded
const getMatches = createMemo(() => getRouter()?.state.matches ?? []);

/**
 * The page of the last resolved route: "404" for an unknown url (the root
 * route renders it), "loading" before the first route resolved or if it
 * failed to load (its error shows on the loading page).
 */
export const getRoutePage = createMemo((): PageName => {
  const matches = getMatches();
  // private, but the only trace of a global not found (no route matched)
  if (matches.some((match) => match._notFound === true)) return "404";
  if (matches.some((match) => match.status !== "success")) return "loading";
  return matches.at(-1)?.staticData.page ?? "loading";
});

/** The page that should be on screen - the loading page covers the route while it loads. */
export const getTargetPage = createMemo(() =>
  isLoadingPageShown() ? "loading" : getRoutePage(),
);
