import { createSwitchTransition } from "@solid-primitives/transition-group";
import { Outlet } from "@tanstack/solid-router";
import { animate } from "animejs";
import { children, JSXElement, Show } from "solid-js";

import { isLoadingBarShown } from "../states/loading-page";
import { isNavigating, isPendingShown } from "../states/router";
import { applyReducedMotion } from "../utils/misc";
import { LoadingRoutePage } from "./pages/Page";

// duration of the page fade out and of the fade in
const fadeDuration = 125;

async function fade(el: HTMLElement, opacity: number): Promise<void> {
  return new Promise((resolve) => {
    animate(el, {
      opacity,
      duration: applyReducedMotion(fadeDuration),
      onComplete: () => resolve(),
    });
  });
}

/**
 * Whether the loading page covers the routed page: while a loading step's bar
 * shows, and while the router shows a pending route (first load, a navigation
 * slower than its pendingMs: spinner). One loading page element for both, so
 * a slow navigation running into a loading step doesn't fade between two.
 */
function isLoadingShown(): boolean {
  return isPendingShown() || (isNavigating() && isLoadingBarShown());
}

/**
 * Root route component: the routed page, or the loading page while a
 * navigation waits (see isLoadingShown), with the page fade between them. A
 * failed load (the router's error component) and an unknown url (the root's
 * not found component) are routed pages too. The old
 * page fades out completely before the new one is inserted and fades in, so
 * two pages are never in the DOM at once (ADR 0002).
 */
export function RootLayout(): JSXElement {
  const content = children(() => (
    <Show when={!isLoadingShown()} fallback={<LoadingRoutePage />}>
      <Outlet />
    </Show>
  ));
  const currentPage = (): HTMLElement | undefined =>
    content.toArray().find((el) => el instanceof HTMLElement);

  // fade ins waiting for their first frame, cancelled if the page leaves first
  const pendingFadeIns = new Map<Element, number>();

  const pages = createSwitchTransition(currentPage, {
    mode: "out-in",
    // the first page fades in too, replacing the boot loading page
    appear: true,
    onExit: (el, done) => {
      const frame = pendingFadeIns.get(el);
      if (frame !== undefined) {
        // never faded in, still at opacity 0
        cancelAnimationFrame(frame);
        pendingFadeIns.delete(el);
        done();
        return;
      }
      void fade(el, 0).then(done);
    },
    onEnter: (el, done) => {
      // called before the page is attached, and an animation started on a
      // detached element never runs: start on the next frame. Hold the page
      // at opacity 0 until the fade in finished, clearing it earlier can
      // paint one frame of the page fully visible
      el.style.opacity = "0";
      const frame = requestAnimationFrame(() => {
        pendingFadeIns.delete(el);
        void fade(el, 1).then(() => {
          el.style.opacity = "";
          done();
        });
      });
      pendingFadeIns.set(el, frame);
    },
  });

  return <>{pages()}</>;
}
