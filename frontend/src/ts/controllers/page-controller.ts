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
  overrideLoadingOptions?: LoadingOptions;
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

async function getLoadingPromiseWithBarKeyframes(
  loadingOptions: NonNullable<Page<unknown>["loading"]>
): Promise<void> {
  let aborted = false;
  let loadingPromise = loadingOptions.promise();

  // Animate bar keyframes, but allow aborting if loading.promise finishes first
  const keyframePromise = (async () => {
    if (loadingOptions?.barKeyframes !== undefined) {
      for (const keyframe of loadingOptions.barKeyframes) {
        if (aborted) break;
        if (keyframe.text !== undefined) {
          PageLoading.updateText(keyframe.text);
        }
        await PageLoading.updateBar(keyframe.percentage, keyframe.duration);
      }
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

  if (PageTransition.get()) {
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

  //between
  updateTitle(nextPage);
  ActivePage.set(nextPage.id);
  updateOpenGraphUrl();

  const loadingOptions = options.overrideLoadingOptions ?? nextPage.loading;

  //show loading page if needed
  if (loadingOptions && loadingOptions.shouldLoad()) {
    pages.loading.element.removeClass("hidden").css("opacity", 0);
    await pages.loading.beforeShow({});

    if (loadingOptions.barKeyframes !== undefined) {
      await PageLoading.showBar();
      await PageLoading.updateBar(0, 0);
      PageLoading.updateText("");
    } else {
      PageLoading.showSpinner();
    }

    //void here to run the loading promise as soon as possible
    void Misc.promiseAnimation(
      pages.loading.element,
      {
        opacity: "1",
      },
      totalDuration / 2,
      easingMethod
    );

    if (loadingOptions.barKeyframes !== undefined) {
      await getLoadingPromiseWithBarKeyframes(loadingOptions);
      await PageLoading.updateBar(100, 0);
      PageLoading.updateText("Done");
    } else {
      await loadingOptions.promise();
    }

    await Misc.promiseAnimation(
      pages.loading.element,
      {
        opacity: "0",
      },
      totalDuration / 2,
      easingMethod
    );

    await pages.loading.afterHide();
    pages.loading.element.addClass("hidden");
  }

  Focus.set(false);

  //next page
  await nextPage?.beforeShow({
    params: options.params,
    // @ts-expect-error for the future (i think)
    data: options.data,
  });
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
