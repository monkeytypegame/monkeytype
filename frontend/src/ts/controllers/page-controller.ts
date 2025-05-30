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
import { PageName } from "../pages/page";

type ChangeOptions = {
  force?: boolean;
  params?: Record<string, string>;
  data?: unknown;
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

export async function change(
  pageName: PageName,
  options = {} as ChangeOptions
): Promise<boolean> {
  const defaultOptions = {
    force: false,
  };

  options = { ...defaultOptions, ...options };

  return new Promise((resolve) => {
    if (PageTransition.get()) {
      console.debug(
        `change page to ${pageName} stopped, page transition is true`
      );
      resolve(false);
      return;
    }

    if (!options.force && ActivePage.get() === pageName) {
      console.debug(`change page ${pageName} stoped, page already active`);
      resolve(false);
      return;
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

    void previousPage?.beforeHide().then(() => {
      PageTransition.set(true);
      $(".page").removeClass("active");
      void Misc.swapElements(
        previousPage.element,
        nextPage.element,
        250,
        async () => {
          PageTransition.set(false);
          nextPage.element.addClass("active");
          resolve(true);
          await nextPage?.afterShow();
          void AdController.reinstate();
        },
        async () => {
          if (nextPage.id === "test") {
            Misc.updateTitle();
          } else {
            const titleString =
              nextPage.display ??
              Strings.capitalizeFirstLetterOfEachWord(nextPage.id);
            Misc.updateTitle(`${titleString} | Monkeytype`);
          }
          Focus.set(false);
          ActivePage.set(nextPage.id);

          await previousPage?.afterHide();
          await nextPage?.beforeShow({
            params: options.params,
            // @ts-expect-error for the future (i think)
            data: options.data,
          });

          updateOpenGraphUrl();
        }
      );
    });
  });
}
