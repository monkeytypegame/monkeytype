import type { PageName } from "../states/router";

/**
 * Everything that decides which page is on screen and whether a page change
 * is in progress. Kept pure so the whole transition can be tested without the
 * router or the DOM - see states/router.ts for the signals built on top.
 */
export type PageTransitionState = {
  /** The page of the last resolved route ("loading" if loading failed). */
  routePage: PageName;
  /** Whether the loading page covers the route. "error" stays until the next navigation. */
  loadingScreen: "hidden" | "visible" | "error";
  /**
   * The page currently rendered. Lags behind the target page: it only changes
   * once the previous page has faded out.
   */
  mountedPage: PageName;
  fadePhase: "in" | "out";
  /** False while the mounted page is still fading. */
  fadeSettled: boolean;
  /** True while a route is loading and while the page fade is running. */
  transitioning: boolean;
};

export type PageTransitionEvent =
  /** A navigation started. Search param updates and auth reloads have `pathChanged: false`. */
  | { type: "navigationStarted"; pathChanged: boolean }
  /** A route loader needs the loading page. */
  | { type: "loadingShown" }
  | { type: "routeResolved"; page: PageName }
  | { type: "routeFailed" }
  /** The mounted page finished fading in or out. */
  | { type: "fadeCompleted" };

export const initialPageTransitionState: PageTransitionState = {
  routePage: "loading",
  loadingScreen: "visible",
  mountedPage: "loading",
  fadePhase: "in",
  fadeSettled: false,
  transitioning: true,
};

/** The page that should be on screen - the loading page covers the route while it loads. */
export function getTargetPage(state: PageTransitionState): PageName {
  return state.loadingScreen === "hidden" ? state.routePage : "loading";
}

export function transitionPage(
  state: PageTransitionState,
  event: PageTransitionEvent,
): PageTransitionState {
  const next = syncFade(applyEvent(state, event));

  // a route resolving to the page that's already on screen (eg. /profile/a to
  // /profile/b) has no fade to end the transition. Otherwise the fade does
  if (
    event.type === "routeResolved" &&
    event.page === state.routePage &&
    next.fadeSettled
  ) {
    return { ...next, transitioning: false };
  }
  return next;
}

function applyEvent(
  state: PageTransitionState,
  event: PageTransitionEvent,
): PageTransitionState {
  switch (event.type) {
    case "navigationStarted":
      return {
        ...state,
        // a failed load keeps the error up until the next navigation
        loadingScreen:
          state.loadingScreen === "error" ? "hidden" : state.loadingScreen,
        // search param updates and auth reloads don't block input
        transitioning: state.transitioning || event.pathChanged,
      };
    case "loadingShown":
      return { ...state, loadingScreen: "visible" };
    case "routeResolved":
      return {
        ...state,
        loadingScreen: "hidden",
        routePage: event.page,
      };
    case "routeFailed":
      // the loading page shows the error, nothing will fade in to end it
      return {
        ...state,
        loadingScreen: "error",
        routePage: "loading",
        transitioning: false,
      };
    case "fadeCompleted":
      if (state.fadePhase === "out") {
        // whatever the target is by now, so rapid navigation ends up on the last page
        return {
          ...state,
          mountedPage: getTargetPage(state),
          fadePhase: "in",
          fadeSettled: false,
        };
      }
      return {
        ...state,
        fadeSettled: true,
        // the loading page doesn't end it - the route is still loading
        transitioning: state.mountedPage === "loading" && state.transitioning,
      };
  }
}

/**
 * Fades the mounted page out when it's no longer the target, and back in if
 * the target returns to it before the fade out completes.
 */
function syncFade(state: PageTransitionState): PageTransitionState {
  const fadePhase = getTargetPage(state) === state.mountedPage ? "in" : "out";
  return fadePhase === state.fadePhase
    ? state
    : { ...state, fadePhase, fadeSettled: false };
}
