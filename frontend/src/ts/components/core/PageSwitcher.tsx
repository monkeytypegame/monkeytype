import { Outlet } from "@tanstack/solid-router";
import { AnimationParams } from "animejs";
import { JSXElement, Show } from "solid-js";

import { isLoadingBarShown } from "../../states/loading-page";
import { getRoutePage, isPendingShown } from "../../states/router";
import { Anime, AnimePresence } from "../common/anime";
import { LoadingPage } from "../pages/LoadingPage";
import { createNonRouterPage } from "./Page";

const LoadingRoutePage = createNonRouterPage("loading", LoadingPage);

// duration of the page fade out and of the fade in
const fadeDuration = 125;

/**
 * Whether the loading page covers the routed page: while the loading bar is
 * up (a loading step until "Done"), and while the router shows a pending
 * route (first load, a navigation slower than its pendingMs: spinner). One
 * loading page element for both, so a slow navigation running into a loading
 * step doesn't fade between two.
 */
export function isLoadingShown(): boolean {
  return isPendingShown() || isLoadingBarShown();
}

/**
 * Root route component: the routed page, or the loading page while a
 * navigation waits (see isLoadingShown), with the page fade between them. A
 * failed load (the router's error component) and an unknown url (the root's
 * not found component) are routed pages too. The old
 * page fades out completely before the new one is inserted and fades in, so
 * two pages are never in the DOM at once (AnimePresence exitBeforeEnter).
 */
export function PageSwitcher(): JSXElement {
  // same page, new params (/profile/a → /profile/b): same key, no fade. The
  // router keys route components by route id, so the page updates in place
  const pageKey = (): string =>
    isLoadingShown() ? "switcher-loading" : getRoutePage();

  return (
    <AnimePresence exitBeforeEnter>
      <Show when={pageKey()} keyed>
        {(key) => (
          <Anime
            // stands in for the page in main's content grid: full width, and
            // a grid so the page stretches to its height as before
            class="full-width grid"
            initial={{ opacity: 0 } as Partial<AnimationParams>}
            animate={{ opacity: 1, duration: fadeDuration } as AnimationParams}
            exit={{ opacity: 0, duration: fadeDuration } as AnimationParams}
          >
            <Show
              when={key !== "switcher-loading"}
              fallback={<LoadingRoutePage />}
            >
              <Outlet />
            </Show>
          </Anime>
        )}
      </Show>
    </AnimePresence>
  );
}
