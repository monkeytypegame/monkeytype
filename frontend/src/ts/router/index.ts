import { createRouter } from "@tanstack/solid-router";

import * as AdController from "../controllers/ad-controller";
import {
  dispatchPageTransition,
  getRoutePage,
  PageName,
} from "../states/router";
import * as Focus from "../test/focus";
import { updateTitle } from "../utils/misc";
import { capitalizeFirstLetterOfEachWord } from "../utils/strings";
import { navigate, setRouter } from "./navigate";
import { routeTree } from "./routes";
import { setOnAuthStateChange } from "./user-data";

export const router = createRouter({
  routeTree,
  // pages are rendered by <Pages>, a failed load shows its error on the loading page
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

setRouter(router);
setOnAuthStateChange(() => void router.invalidate());

router.subscribe("onBeforeLoad", (event) => {
  dispatchPageTransition({
    type: "navigationStarted",
    pathChanged: event.pathChanged,
  });
});

let isInitialLoad = true;

router.subscribe("onResolved", () => {
  const prevPage = getRoutePage();

  const failedMatch = router.state.matches.find((m) => m.status === "error");
  if (failedMatch !== undefined) {
    const error: unknown = failedMatch.error;
    dispatchPageTransition({
      type: "routeFailed",
      message: error instanceof Error ? error.message : String(error),
    });
  } else {
    const page = router.state.matches.at(-1)?.staticData.page;
    if (page === undefined) return;
    dispatchPageTransition({ type: "routeResolved", page });
  }

  updateOpenGraphUrl();

  if (isInitialLoad) {
    isInitialLoad = false;
    document.body.classList.remove("loading");
  }

  const page = getRoutePage();
  if (page === prevPage) return;

  updatePageTitle(page);
  Focus.set(false);
  void AdController.reinstate();
});

/**
 * Handles clicks on `[router-link]` anchors (still used in vanilla markup).
 */
export function initRouter(): () => void {
  const onClick = (e: MouseEvent): void => {
    if (!(e.target instanceof Element)) return;
    const target = e.target.closest<HTMLAnchorElement>("a[router-link]");
    if (target === null || target.href === "") return;
    e.preventDefault();
    void navigate(target.href);
  };
  document.body.addEventListener("click", onClick);
  return () => document.body.removeEventListener("click", onClick);
}

function updatePageTitle(page: PageName): void {
  if (page === "test") {
    updateTitle();
  } else {
    updateTitle(`${capitalizeFirstLetterOfEachWord(page)} | Monkeytype`);
  }
}

function updateOpenGraphUrl(): void {
  let tag = document.querySelector('meta[property="og:url"]');
  if (tag === null) {
    tag = document.createElement("meta");
    tag.setAttribute("property", "og:url");
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", window.location.href);
}
