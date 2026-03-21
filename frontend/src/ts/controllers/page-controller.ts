import * as Misc from "../utils/misc";
import * as Strings from "../utils/strings";
import {
  getActivePage,
  setActivePage,
  setSelectedProfileName,
} from "../states/core";
import * as Settings from "../pages/settings";
import * as Account from "../pages/account";
import * as PageTest from "../pages/test";
import * as PageLoading from "../pages/loading";
import * as Friends from "../pages/friends";
import * as Page404 from "../pages/404";
import * as PageAccountSettings from "../pages/account-settings";
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
import { onDOMReady, qsa, qsr } from "../utils/dom";
import * as Skeleton from "../utils/skeleton";
import {
  LeaderboardUrlParamsSchema,
  readGetParameters,
} from "../states/leaderboard-selection";
import { configurationPromise as serverConfigurationPromise } from "../ape/server-configuration";
import { showBlockingLoadingScreen } from "./loading-screen";

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
  login: solidPage("login"),
  profile: solidPage("profile", {
    beforeShow: async (options) => {
      setSelectedProfileName(options.params?.["uidOrName"]);
    },
  }),
  profileSearch: solidPage("profileSearch"),
  friends: Friends.page,
  404: Page404.page,
  accountSettings: PageAccountSettings.page,
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
      readGetParameters(options.urlParams);
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
      await showBlockingLoadingScreen({
        loadingOptions: syncLoadingOptions,
        totalDuration,
      });
    }
  } catch (error) {
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
    urlParamsSchema?: never;
    loadingOptions?: LoadingOptions;
    beforeShow?: PageProperties<undefined>["beforeShow"];
    afterHide?: () => Promise<void>;
  },
): Page<undefined>;
function solidPage<U extends UrlParamsSchema>(
  id: PageName,
  props: {
    path?: string;
    urlParamsSchema: U;
    loadingOptions?: LoadingOptions;
    beforeShow?: (options: OptionsWithUrlParams<undefined, U>) => Promise<void>;
    afterHide?: () => Promise<void>;
  },
): PageWithUrlParams<undefined, U>;
function solidPage<U extends UrlParamsSchema>(
  id: PageName,
  props?: {
    path?: string;
    urlParamsSchema?: U;
    loadingOptions?: LoadingOptions;
    beforeShow?: (options: OptionsWithUrlParams<undefined, U>) => Promise<void>;
    afterHide?: () => Promise<void>;
  },
): Page<undefined> | PageWithUrlParams<undefined, U> {
  const path = props?.path ?? `/${id}`;
  const internalId = `page${Strings.capitalizeFirstLetter(id)}`;
  onDOMReady(() => Skeleton.save(internalId));

  const shared = {
    id,
    path,
    element: qsr(`#${internalId}`),
    loadingOptions: props?.loadingOptions,
    afterHide: async () => {
      Skeleton.remove(internalId);
      await props?.afterHide?.();
    },
  };

  if (props?.urlParamsSchema !== undefined) {
    return new PageWithUrlParams({
      ...shared,
      urlParamsSchema: props.urlParamsSchema,
      beforeShow: async (options) => {
        Skeleton.append(internalId, "main");
        await props.beforeShow?.(options);
      },
    });
  }

  return new Page({
    ...shared,
    beforeShow: async (options) => {
      Skeleton.append(internalId, "main");
      await props?.beforeShow?.(options);
    },
  });
}
