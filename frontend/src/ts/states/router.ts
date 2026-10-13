import { createMemo } from "solid-js";

import type { PageName } from "../components/pages/Pages";
import { getRouter } from "../router/navigate";
import { isLoadingPageShown } from "./loading-page";

export type { PageName };

// matches only change once a route has loaded
const getMatches = createMemo(() => getRouter()?.state.matches ?? []);

const getFailedMatch = createMemo(() =>
  getMatches().find((match) => match.status === "error"),
);

/** The page of the last resolved route ("loading" before the first one, or if loading failed). */
export const getRoutePage = createMemo((): PageName => {
  if (getFailedMatch() !== undefined) return "loading";
  return getMatches().at(-1)?.staticData.page ?? "loading";
});

/** Why the last route failed to load, shown on the loading page until a route loads. */
export const getLoadingError = createMemo((): string | null => {
  const match = getFailedMatch();
  if (match === undefined) return null;
  const error: unknown = match.error;
  return error instanceof Error ? error.message : String(error);
});

/** The page that should be on screen - the loading page covers the route while it loads. */
export const getTargetPage = createMemo(() =>
  isLoadingPageShown() || getLoadingError() !== null
    ? "loading"
    : getRoutePage(),
);
