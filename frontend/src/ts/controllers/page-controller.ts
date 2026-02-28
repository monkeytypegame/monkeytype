import * as Misc from "../utils/misc";
import * as Strings from "../utils/strings";
import {
  getActivePage,
  setActivePage,
  setSelectedProfileName,
} from "../signals/core";
import * as Settings from "../pages/settings";
import * as Account from "../pages/account";
import * as PageTest from "../pages/test";
import * as PageLogin from "../pages/login";
import * as PageLoading from "../pages/loading";
import * as Friends from "../pages/friends";
import * as Page404 from "../pages/404";
import * as PageLeaderboards from "../pages/leaderboards";
import * as PageAccountSettings from "../pages/account-settings";
import * as PageTransition from "../states/page-transition";
import * as AdController from "../controllers/ad-controller";
import * as Focus from "../test/focus";
import Page, { PageName, LoadingOptions, PageProperties } from "../pages/page";
import { onDOMReady, qsa, qsr } from "../utils/dom";
import * as Skeleton from "../utils/skeleton";

type ChangeOptions = {
  force?: boolean;
  params?: Record<string, string>;
  data?: unknown;
  loadingOptions?: LoadingOptions;
};

const pages = {
  loading: PageLoading.page,
  test: PageTest.page,
  settings: Settings.page,
  about: solidPage("about"),
  account: Account.page,
  login: PageLogin.page,
  profile: solidPage("profile", {
    beforeShow: async (options) => {
      setSelectedProfileName(options.params?.["uidOrName"]);
    },
  }),
  profileSearch: solidPage("profileSearch"),
  friends: Friends.page,
  404: Page404.page,
  accountSettings: PageAccountSettings.page,
  leaderboards: PageLeaderboards.page,
};

function updateOpenGraphUrl(): void {
  const ogUrlTag = document.querySelector('meta[property="og:url"]');
  const currentUrl = window.location.href;

  if (ogUrlTag) {
    // Update existing tag
    ogUrlTag.setAttribute("content", currentUrl);
  } else {
    // Create and append new tag if it doesn't exist
    const newOgUrlTag = document.createElement("meta");
    newOgUrlTag.setAttribute("property", "og:url");
    newOgUrlTag.content = currentUrl;
    document.head.appendChild(newOgUrlTag);
  }
}

function updateTitle(nextPage: { id: string; display?: string }): void {
  if (nextPage.id === "test") {
    Misc.updateTitle();
  } else {
    const titleString =
      nextPage.display ?? Strings.capitalizeFirstLetterOfEachWord(nextPage.id);
    Misc.updateTitle(`${titleString} | Monkeytype`);
  }
}

async function showSyncLoading({
  loadingOptions,
  totalDuration,
}: {
  loadingOptions: LoadingOptions[];
  totalDuration: number;
}): Promise<void> {
  PageLoading.page.element.show().setStyle({ opacity: "0" });
  await PageLoading.page.beforeShow({});

  const fillDivider = loadingOptions.length;
  const fillOffset = 100 / fillDivider;

  //void here to run the loading promise as soon as possible
  void PageLoading.page.element.promiseAnimate({
    opacity: "1",
    duration: totalDuration / 2,
  });

  for (let i = 0; i < loadingOptions.length; i++) {
    const currentOffset = fillOffset * i;
    const options = loadingOptions[i] as LoadingOptions;
    if (options.style === "bar") {
      await PageLoading.showBar();
      if (i === 0) {
        await PageLoading.updateBar(0, 0);
        PageLoading.updateText("");
      }
    } else {
      PageLoading.showSpinner();
    }

    if (options.style === "bar") {
      await getLoadingPromiseWithBarKeyframes(
        options,
        fillDivider,
        currentOffset,
      );
      void PageLoading.updateBar(100, 125);
      PageLoading.updateText("Done");
    } else {
      await options.loadingPromise();
    }
  }

  await PageLoading.page.element.promiseAnimate({
    opacity: "0",
    duration: totalDuration / 2,
  });

  await PageLoading.page.afterHide();
  PageLoading.page.element.hide();
}

// Global abort controller for keyframe promises
let keyframeAbortController: AbortController | null = null;

async function getLoadingPromiseWithBarKeyframes(
  loadingOptions: Extract<
    NonNullable<Page<unknown>["loadingOptions"]>,
    { style: "bar" }
  >,
  fillDivider: number,
  fillOffset: number,
): Promise<void> {
  let loadingPromise = loadingOptions.loadingPromise();

  // Create abort controller for this keyframe sequence
  const localAbortController = new AbortController();
  keyframeAbortController = localAbortController;

  // Animate bar keyframes, but allow aborting if loading.promise finishes first or if globally aborted
  const keyframePromise = (async () => {
    for (const keyframe of loadingOptions.keyframes) {
      if (localAbortController.signal.aborted) break;
      if (keyframe.text !== undefined) {
        PageLoading.updateText(keyframe.text);
      }
      await PageLoading.updateBar(
        fillOffset + keyframe.percentage / fillDivider,
        keyframe.durationMs,
      );
    }
  })();

  // Wait for either the keyframes or the loading.promise to finish
  await Promise.race([
    keyframePromise,
    (async () => {
      await loadingPromise;
      localAbortController.abort();
    })(),
  ]);

  // Always wait for loading.promise to finish before continuing
  await loadingPromise;

  // Clean up the abort controller
  if (keyframeAbortController === localAbortController) {
    keyframeAbortController = null;
  }

  return;
}

export async function change(
  pageName: PageName,
  options = {} as ChangeOptions,
): Promise<boolean> {
  const defaultOptions = {
    force: false,
  };

  options = { ...defaultOptions, ...options };

  if (PageTransition.get() && !options.force) {
    console.debug(
      `change page to ${pageName} stopped, page transition is true`,
    );
    return false;
  }

  if (!options.force && getActivePage() === pageName) {
    console.debug(`change page ${pageName} stoped, page already active`);
    return false;
  } else {
    console.log(`changing page ${pageName}`);
  }

  const previousPage = pages[getActivePage()];
  const nextPage = pages[pageName];
  const totalDuration = Misc.applyReducedMotion(250);

  //start
  PageTransition.set(true);
  qsa(".page")?.removeClass("active");

  //previous page
  await previousPage?.beforeHide?.();
  previousPage.element.show().setStyle({ opacity: "1" });
  await previousPage.element.promiseAnimate({
    opacity: "0",
    duration: totalDuration / 2,
  });
  previousPage.element.hide();
  await previousPage?.afterHide();

  // we need to evaluate and store next page loading mode in case options.loadingOptions.loadingMode is sync
  const nextPageLoadingMode = nextPage.loadingOptions?.loadingMode();

  //show loading page if needed
  try {
    let syncLoadingOptions: LoadingOptions[] = [];
    if (options.loadingOptions?.loadingMode() === "sync") {
      syncLoadingOptions.push(options.loadingOptions);
    }
    if (nextPage.loadingOptions?.loadingMode() === "sync") {
      syncLoadingOptions.push(nextPage.loadingOptions);
    }

    if (syncLoadingOptions.length > 0) {
      await showSyncLoading({
        loadingOptions: syncLoadingOptions,
        totalDuration,
      });
    }

    // Clean up abort controller after successful loading
    if (keyframeAbortController) {
      keyframeAbortController = null;
    }
  } catch (error) {
    // Abort any running keyframe promises
    if (keyframeAbortController) {
      keyframeAbortController.abort();
      keyframeAbortController = null;
    }

    pages.loading.element.addClass("active");
    setActivePage(pages.loading.id);
    Focus.set(false);
    PageLoading.showError();
    PageLoading.updateText(
      `Failed to load the ${nextPage.id} page: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    PageTransition.set(false);
    return false;
  }

  //between
  updateTitle(nextPage);
  setActivePage(nextPage.id);
  updateOpenGraphUrl();
  Focus.set(false);

  //next page
  await nextPage?.beforeShow({
    params: options.params,
    // @ts-expect-error for the future (i think)
    data: options.data,
  });

  if (
    typeof nextPageLoadingMode === "object" &&
    nextPageLoadingMode.mode === "async"
  ) {
    nextPageLoadingMode.beforeLoading?.();
    void nextPage?.loadingOptions?.loadingPromise().then(() => {
      nextPageLoadingMode.afterLoading?.();
    });
  }

  nextPage.element.show().setStyle({ opacity: "0" });
  await nextPage.element.promiseAnimate({
    opacity: "1",
    duration: totalDuration / 2,
  });
  nextPage.element.addClass("active");
  await nextPage?.afterShow();

  //wrapup
  PageTransition.set(false);
  void AdController.reinstate();
  return true;
}

function solidPage(
  id: PageName,
  props?: {
    path?: string;
    beforeShow?: PageProperties<undefined>["beforeShow"];
  },
): Page<undefined> {
  const path = props?.path ?? `/${id}`;
  const internalId = `page${Strings.capitalizeFirstLetter(id)}`;
  onDOMReady(() => Skeleton.save(internalId));
  return new Page({
    id,
    path,
    element: qsr(`#${internalId}`),
    beforeShow: async (options) => {
      Skeleton.append(internalId, "main");
      await props?.beforeShow?.(options);
    },
    afterHide: async () => {
      Skeleton.remove(internalId);
    },
  });
}
