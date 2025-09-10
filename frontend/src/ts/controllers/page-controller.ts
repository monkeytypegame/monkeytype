import * as Misc from "../utils/misc";
import * as Strings from "../utils/strings";
import * as ActivePage from "../states/active-page";
import * as Settings from "../pages/settings";
import * as Account from "../pages/account";
import * as PageTest from "../pages/test";
import * as PageAbout from "../pages/about";
import * as PageLogin from "../pages/login";
import * as PageLoading from "../pages/loading";
import * as PageProfile from "../pages/profile";
import * as PageProfileSearch from "../pages/profile-search";
import * as Page404 from "../pages/404";
import * as PageLeaderboards from "../pages/leaderboards";
import * as PageAccountSettings from "../pages/account-settings";
import * as PageTransition from "../states/page-transition";
import * as AdController from "../controllers/ad-controller";
import * as Focus from "../test/focus";
import Page, { PageName, LoadingOptions } from "../pages/page";

type ChangeOptions = {
  force?: boolean;
  params?: Record<string, string>;
  data?: unknown;
  loadingOptions?: LoadingOptions;
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

async function showLoading({
  loadingOptions,
  totalDuration,
  easingMethod,
}: {
  loadingOptions: LoadingOptions[];
  totalDuration: number;
  easingMethod: Misc.JQueryEasing;
}): Promise<void> {
  PageLoading.page.element.removeClass("hidden").css("opacity", 0);
  await PageLoading.page.beforeShow({});

  const fillDivider = loadingOptions.length;
  const fillOffset = 100 / fillDivider;

  //void here to run the loading promise as soon as possible
  void Misc.promiseAnimation(
    PageLoading.page.element,
    {
      opacity: "1",
    },
    totalDuration / 2,
    easingMethod
  );

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
        currentOffset
      );
      void PageLoading.updateBar(100, 125);
      PageLoading.updateText("Done");
    } else {
      await options.waitFor();
    }
  }

  await Misc.promiseAnimation(
    PageLoading.page.element,
    {
      opacity: "0",
    },
    totalDuration / 2,
    easingMethod
  );

  await PageLoading.page.afterHide();
  PageLoading.page.element.addClass("hidden");
}

async function getLoadingPromiseWithBarKeyframes(
  loadingOptions: Extract<
    NonNullable<Page<unknown>["loadingOptions"]>,
    { style: "bar" }
  >,
  fillDivider: number,
  fillOffset: number
): Promise<void> {
  let aborted = false;
  let loadingPromise = loadingOptions.waitFor();

  // Animate bar keyframes, but allow aborting if loading.promise finishes first
  const keyframePromise = (async () => {
    for (const keyframe of loadingOptions.keyframes) {
      if (aborted) break;
      if (keyframe.text !== undefined) {
        PageLoading.updateText(keyframe.text);
      }
      await PageLoading.updateBar(
        fillOffset + keyframe.percentage / fillDivider,
        keyframe.durationMs
      );
    }
  })();

  // Wait for either the keyframes or the loading.promise to finish
  await Promise.race([
    keyframePromise,
    (async () => {
      await loadingPromise;
      aborted = true;
    })(),
  ]);

  // Always wait for loading.promise to finish before continuing
  await loadingPromise;
  return;
}

export async function change(
  pageName: PageName,
  options = {} as ChangeOptions
): Promise<boolean> {
  const defaultOptions = {
    force: false,
  };

  options = { ...defaultOptions, ...options };

  if (PageTransition.get() && !options.force) {
    console.debug(
      `change page to ${pageName} stopped, page transition is true`
    );
    return false;
  }

  if (!options.force && ActivePage.get() === pageName) {
    console.debug(`change page ${pageName} stoped, page already active`);
    return false;
  } else {
    console.log(`changing page ${pageName}`);
  }

  const pages = {
    loading: PageLoading.page,
    test: PageTest.page,
    settings: Settings.page,
    about: PageAbout.page,
    account: Account.page,
    login: PageLogin.page,
    profile: PageProfile.page,
    profileSearch: PageProfileSearch.page,
    404: Page404.page,
    accountSettings: PageAccountSettings.page,
    leaderboards: PageLeaderboards.page,
  };

  const previousPage = pages[ActivePage.get()];
  const nextPage = pages[pageName];
  const totalDuration = Misc.applyReducedMotion(250);
  const easingMethod: Misc.JQueryEasing = "swing";

  //start
  PageTransition.set(true);
  $(".page").removeClass("active");

  //previous page
  await previousPage?.beforeHide?.();
  previousPage.element.removeClass("hidden").css("opacity", 1);
  await Misc.promiseAnimation(
    previousPage.element,
    {
      opacity: "0",
    },
    totalDuration / 2,
    easingMethod
  );
  previousPage.element.addClass("hidden");
  await previousPage?.afterHide();

  const nextPageLoadingMode = nextPage.loadingOptions?.loadingMode();

  //show loading page if needed
  try {
    let loadingOptions: LoadingOptions[] = [];
    if (options.loadingOptions) {
      loadingOptions.push(options.loadingOptions);
    }
    if (nextPage.loadingOptions) {
      loadingOptions.push(nextPage.loadingOptions);
    }

    if (loadingOptions.length > 0) {
      if (
        options.loadingOptions?.loadingMode() === "sync" ||
        nextPageLoadingMode === "sync"
      ) {
        await showLoading({
          loadingOptions,
          totalDuration,
          easingMethod,
        });
      }
    }
  } catch (error) {
    pages.loading.element.addClass("active");
    ActivePage.set(pages.loading.id);
    Focus.set(false);
    PageLoading.showError();
    PageLoading.updateText(
      `Failed to load the ${nextPage.id} page: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    PageTransition.set(false);
    return false;
  }

  //between
  updateTitle(nextPage);
  ActivePage.set(nextPage.id);
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
    nextPageLoadingMode.onCall();
    void nextPage?.loadingOptions?.waitFor().then(() => {
      nextPageLoadingMode.afterResolve();
    });
  }

  nextPage.element.removeClass("hidden").css("opacity", 0);
  await Misc.promiseAnimation(
    nextPage.element,
    {
      opacity: "1",
    },
    totalDuration / 2,
    easingMethod
  );
  nextPage.element.addClass("active");
  await nextPage?.afterShow();

  //wrapup
  PageTransition.set(false);
  void AdController.reinstate();
  return true;
}
