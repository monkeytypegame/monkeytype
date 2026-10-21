import type { RegisteredRouter } from "@tanstack/solid-router";
import { createMemo, createRoot } from "solid-js";

import { getRouter } from "../router/instance";
import type { PageName } from "../router/routes";

function getMatches(): RegisteredRouter["state"]["matches"] {
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
    if (isNotFound(matches)) return "404";
    if (matches.some((match) => match.status !== "success")) return "loading";
    return matches.at(-1)?.staticData.page ?? "loading";
  }),
);

/**
 * Whether the router shows a pending route: on first load, and once a
 * navigation took longer than its pendingMs. Not for an unknown url, whose
 * routes stay pending behind the 404 page.
 */
export function isPendingShown(): boolean {
  const matches = getMatches();
  if (isNotFound(matches)) return false;
  return matches.some((match) => match.status === "pending");
}

/** Whether the first route has not resolved yet. Reactive. */
export function isInitialLoad(): boolean {
  return getRouter()?.state.resolvedLocation === undefined;
}

/**
 * Whether the url matched no route (the root renders the 404 page). Reads
 * the router's private `_notFound` flag: no public api tells a global not
 * found apart (match status stays "success", its prefix routes "pending").
 * Keep this the only place reading it.
 */
function isNotFound(matches: ReturnType<typeof getMatches>): boolean {
  return matches.some((match) => match._notFound === true);
}

/**
 * Whether a navigation to another path is in progress (eg. the page fades
 * out). A reload in place (eg. signing in) doesn't count.
 */
export function isLeavingPage(): boolean {
  const state = getRouter()?.state;
  if (state?.status !== "pending") return false;
  return state.location.pathname !== state.resolvedLocation?.pathname;
}
