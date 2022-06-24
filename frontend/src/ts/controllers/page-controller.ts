import * as Misc from "../utils/misc";
import * as ActivePage from "../states/active-page";
import * as Settings from "../pages/settings";
import * as Account from "../pages/account";
// import * as ManualRestart from "../test/manual-restart-tracker";
import * as PageTest from "../pages/test";
import * as PageAbout from "../pages/about";
import * as PageLogin from "../pages/login";
import * as PageLoading from "../pages/loading";
import * as PageProfile from "../pages/profile";
import * as PageTransition from "../states/page-transition";
import type Page from "../pages/page";
// import { Auth } from "../firebase";

export async function change(
  page: Page,
  force = false,
  params?: { [key: string]: string }
): Promise<boolean> {
  return new Promise((resolve) => {
    if (PageTransition.get()) {
      console.log(`change page ${page.name} stopped`);
      return resolve(false);
    }
    console.log(`change page ${page.name}`);

    if (!force && ActivePage.get() === page.name) {
      console.log(`page ${page.name} already active`);
      return resolve(false);
    }

    const pages: Record<string, Page> = {
      loading: PageLoading.page,
      test: PageTest.page,
      settings: Settings.page,
      about: PageAbout.page,
      account: Account.page,
      login: PageLogin.page,
      profile: PageProfile.page,
    };

    const previousPage = pages[ActivePage.get()];
    const nextPage = page;

    previousPage?.beforeHide();
    PageTransition.set(true);
    $(".page").removeClass("active");
    Misc.swapElements(
      previousPage.element,
      nextPage.element,
      250,
      async () => {
        PageTransition.set(false);
        ActivePage.set(nextPage.name);
        previousPage?.afterHide();
        nextPage.element.addClass("active");
        resolve(true);
        nextPage?.afterShow();
      },
      async () => {
        await nextPage?.beforeShow(params);
      }
    );
  });
}

// $(document).on("click", "#top .logo", () => {
//   change("test");
// });

// $(document).on("click", "#top #menu .text-button", (e) => {
//   if (!$(e.currentTarget).hasClass("leaderboards")) {
//     const href = $(e.currentTarget).attr("href") as string;
//     ManualRestart.set();
//     change(href.replace("/", "") as MonkeyTypes.Page);
//   }
//   return false;
// });

// $(".pageTest .loginTip .link").on("click", async () => {
//   change("login");
// });
