import type { RouteIds } from "@tanstack/solid-router";
import { createMemo, createRoot } from "solid-js";

import type { AppRouter } from "../router/create-router";
import { getRouter } from "../router/navigate";

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

type RouteId = RouteIds<AppRouter["routeTree"]>;

// routes that render no page of their own
type PagelessRouteId = "__root__" | "/app" | "/app/verify";

/** The page each route renders. */
const pageOfRoute: Record<Exclude<RouteId, PagelessRouteId>, PageName> = {
  "/app/": "test",
  "/app/leaderboards": "leaderboards",
  "/app/about": "about",
  "/app/settings": "settings",
  "/app/login": "login",
  "/app/account": "account",
  "/app/account-settings": "accountSettings",
  "/app/profile": "profileSearch",
  "/app/profile/$uidOrName": "profile",
  "/app/friends": "friends",
};

function getMatches(): AppRouter["state"]["matches"] {
  return getRouter()?.state.matches ?? [];
}

/**
 * The page of the last resolved route: "404" for an unknown url (the root
 * route renders it), "loading" before the first route resolved or if it
 * failed to load (its error shows on the loading page).
 * Reactive: read in a tracked scope to follow page changes.
 */
// in a root so it is owned, the router keeps its own state the same way.
// a memo so readers only re-run when the page changes, not on every router state change
export const getRoutePage = createRoot(() =>
  createMemo((): PageName => {
    const matches = getMatches();
    // private, but the only trace of a global not found (no route matched)
    if (matches.some((match) => match._notFound === true)) return "404";
    if (matches.some((match) => match.status !== "success")) return "loading";
    const routeId = matches.at(-1)?.routeId;
    if (routeId === undefined || !(routeId in pageOfRoute)) return "loading";
    return pageOfRoute[routeId as keyof typeof pageOfRoute];
  }),
);

/**
 * Whether the router shows a pending route: on first load, and once a
 * navigation took longer than its pendingMs. Not for an unknown url, whose
 * routes stay pending behind the 404 page.
 */
export function isPendingShown(): boolean {
  const matches = getMatches();
  if (matches.some((match) => match._notFound === true)) return false;
  return matches.some((match) => match.status === "pending");
}

/** Whether a navigation is in progress (the loading page may cover the current page). */
export function isNavigating(): boolean {
  return getRouter()?.state.status === "pending";
}
