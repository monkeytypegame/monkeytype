import { createRouter } from "@tanstack/solid-router";
import { batch } from "solid-js";

import * as AdController from "../controllers/ad-controller";
import { getLoadingScreen, setLoadingScreen } from "../states/loading-page";
import {
  getRoutePage,
  PageName,
  setPageTransitioning,
  setRoutePage,
} from "../states/router";
import * as Focus from "../test/focus";
import { updateTitle } from "../utils/misc";
import { capitalizeFirstLetterOfEachWord } from "../utils/strings";
import { navigate, setRouter } from "./navigate";
import { routeTree } from "./routes";
import { setOnAuthStateChange } from "./user-data";

export const router = createRouter({
  routeTree,
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
  // a failed load keeps the error up until the next navigation
  if (getLoadingScreen() === "error") setLoadingScreen("hidden");
  // search param updates and auth reloads don't block input
  if (!event.pathChanged) return;
  setPageTransitioning(true);
});

let isInitialLoad = true;

router.subscribe("onResolved", () => {
  const page = router.state.matches.at(-1)?.staticData.page;
  if (page === undefined) return;

  const failed = getLoadingScreen() === "error";
  const nextPage: PageName = failed ? "loading" : page;
  const pageChanged = nextPage !== getRoutePage();

  batch(() => {
    if (!failed) setLoadingScreen("hidden");
    setRoutePage(nextPage);
  });

  updateOpenGraphUrl();

  if (isInitialLoad) {
    isInitialLoad = false;
    document.body.classList.remove("loading");
  }

  // otherwise <Pages> ends the transition once the new page has faded in.
  // search param updates (pages writing their state to the url) also resolve
  if (!pageChanged || failed) setPageTransitioning(false);
  if (!pageChanged) return;

  updatePageTitle(nextPage);
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
