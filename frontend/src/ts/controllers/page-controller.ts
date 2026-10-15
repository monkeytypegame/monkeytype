import { batch } from "solid-js";
import { waitForShownPage } from "../components/pages/Pages";
import * as Misc from "../utils/misc";
import * as Strings from "../utils/strings";
import {
  getActivePage,
  setActivePage,
  setSelectedProfileName,
} from "../states/core";
import * as PageTest from "../pages/test";
import * as PageLoading from "../pages/loading";
import {
  setLoadingPageBarStart,
  setLoadingShown,
  showLoadingPageBar,
  showLoadingPageError,
  showLoadingPageSpinner,
  updateLoadingPageBar,
  updateLoadingPageText,
} from "../states/loading-page";
import * as PageTransition from "../legacy-states/page-transition";
import * as AdController from "../controllers/ad-controller";
import * as Focus from "../test/focus";
import Page, {
  PageName,
  LoadingOptions,
  PageProperties,
  PageWithUrlParams,
  UrlParamsSchema,
  OptionsWithUrlParams,
} from "../pages/page";
import {
  LeaderboardUrlParamsSchema,
  readLeaderboardGetParameters,
} from "../states/leaderboard-selection";
import { configurationPromise as serverConfigurationPromise } from "../ape/server-configuration";
import { getSnapshot } from "../db";
import * as TodayTracker from "../test/today-tracker";
import { isResultsReady, waitForResultsReady } from "../collections/results";
import {
  invalidateConnections,
  isConnectionsReady,
  waitForConnectionsReady,
} from "../collections/connections";
import {
  AccountSettingsUrlParamsSchema,
  readAccountSettingsGetParameters,
} from "../states/account-settings";

type ChangeOptions = {
  force?: boolean;
  params?: Record<string, string>;
  data?: unknown;
  loadingOptions?: LoadingOptions;
};

const pages = {
  loading: PageLoading.page,
  test: PageTest.page,
  settings: solidPage("settings"),
  about: solidPage("about"),
  account: solidPage("account", {
    loadingOptions: {
      loadingMode: () => {
        if (isResultsReady()) {
          return "none";
        } else {
          return "sync";
        }
      },
      loadingPromise: async () => {
        if (getSnapshot() === null || getSnapshot() === undefined) {
          throw new Error(
            "Looks like your account data didn't download correctly. Please refresh the page.<br>If this error persists, please contact support.",
          );
        }
        await waitForResultsReady();
        TodayTracker.addAllFromToday();
      },
      style: "bar",
      keyframes: [
        {
          percentage: 90,
          durationMs: 2000,
          text: "Downloading results...",
        },
      ],
    },
  }),
  login: solidPage("login"),
  profile: solidPage("profile", {
    beforeShow: async (options) => {
      setSelectedProfileName(options.params?.["uidOrName"]);
    },
  }),
  profileSearch: solidPage("profileSearch"),
  404: solidPage("404"),
  friends: solidPage("friends", {
    beforeShow: async () => {
      await invalidateConnections();
    },
    loadingOptions: {
      loadingMode: () => (isConnectionsReady() ? "none" : "sync"),
      loadingPromise: async () => {
        await Promise.all([
          serverConfigurationPromise,
          waitForConnectionsReady(),
        ]);
      },
      style: "bar",
      keyframes: [
        { percentage: 50, durationMs: 1500, text: "Downloading friends..." },
        {
          percentage: 50,
          durationMs: 1500,
          text: "Downloading friend requests...",
        },
      ],
    },
  }),
  accountSettings: solidPage("accountSettings", {
    urlParamsSchema: AccountSettingsUrlParamsSchema,
    beforeShow: async (options) => {
      readAccountSettingsGetParameters(options.urlParams);
    },
  }),
  leaderboards: solidPage("leaderboards", {
    urlParamsSchema: LeaderboardUrlParamsSchema,
    loadingOptions: {
      style: "spinner",
      loadingMode: () => "sync",
      loadingPromise: async () => {
        await serverConfigurationPromise;
      },
    },
    beforeShow: async (options) => {
      readLeaderboardGetParameters(options.urlParams);
    },
  }),
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

/**
 * Runs the sync loading steps on the loading page. The caller shows and hides
 * the loading page.
 */
async function runSyncLoading(loadingOptions: LoadingOptions[]): Promise<void> {
  const fillDivider = loadingOptions.length;
  const fillOffset = 100 / fillDivider;

  for (let i = 0; i < loadingOptions.length; i++) {
    const currentOffset = fillOffset * i;
    const options = loadingOptions[i] as LoadingOptions;
    if (options.style === "bar") {
      showLoadingPageBar();
      if (i === 0) {
        setLoadingPageBarStart(0);
        await updateLoadingPageBar(0, 0);
        updateLoadingPageText("");
      }
    } else {
      showLoadingPageSpinner();
    }

    if (options.style === "bar") {
      await getLoadingPromiseWithBarKeyframes(
        options,
        fillDivider,
        currentOffset,
      );
      void updateLoadingPageBar(100, 125);
      updateLoadingPageText("Done");
    } else {
      await options.loadingPromise();
    }
  }
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
        updateLoadingPageText(keyframe.text);
      }
      await updateLoadingPageBar(
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

  //start
  PageTransition.set(true);

  //previous page
  await previousPage.beforeHide();

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
      // fades the previous page out and the loading page in, unless the
      // loading page is already shown (boot)
      setLoadingShown(true);
      await runSyncLoading(syncLoadingOptions);
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

    // the loading page stays shown, now as the active page
    batch(() => {
      setActivePage(pages.loading.id);
      setLoadingShown(false);
    });
    Focus.set(false);
    showLoadingPageError();
    updateLoadingPageText(
      `Failed to load the ${nextPage.id} page: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    PageTransition.set(false);
    return false;
  }

  //between
  updateTitle(nextPage);
  // in one batch so the previous page doesn't come back between the two
  batch(() => {
    setActivePage(nextPage.id);
    setLoadingShown(false);
  });
  updateOpenGraphUrl();

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

  await waitForShownPage();
  Focus.set(false);
  await nextPage.afterShow();

  //wrapup
  PageTransition.set(false);
  void AdController.reinstate();
  return true;
}

function solidPage(
  id: PageName,
  props?: {
    path?: string;
    urlParamsSchema?: never;
    loadingOptions?: LoadingOptions;
    beforeShow?: PageProperties<undefined>["beforeShow"];
  },
): Page<undefined>;
function solidPage<U extends UrlParamsSchema>(
  id: PageName,
  props: {
    path?: string;
    urlParamsSchema: U;
    loadingOptions?: LoadingOptions;
    beforeShow?: (options: OptionsWithUrlParams<undefined, U>) => Promise<void>;
  },
): PageWithUrlParams<undefined, U>;
function solidPage<U extends UrlParamsSchema>(
  id: PageName,
  props?: {
    path?: string;
    urlParamsSchema?: U;
    loadingOptions?: LoadingOptions;
    beforeShow?: (options: OptionsWithUrlParams<undefined, U>) => Promise<void>;
  },
): Page<undefined> | PageWithUrlParams<undefined, U> {
  const shared = {
    id,
    path: props?.path ?? `/${id}`,
    loadingOptions: props?.loadingOptions,
  };

  if (props?.urlParamsSchema !== undefined) {
    return new PageWithUrlParams({
      ...shared,
      urlParamsSchema: props.urlParamsSchema,
      beforeShow: props.beforeShow,
    });
  }

  return new Page({ ...shared, beforeShow: props?.beforeShow });
}
