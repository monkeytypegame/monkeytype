import * as Misc from "../utils/misc";
import * as ActivePage from "../states/active-page";
import * as Settings from "../pages/settings";
import * as Account from "../pages/account";
import * as PageTest from "../pages/test";
import * as PageAbout from "../pages/about";
import * as PageLogin from "../pages/login";
import * as PageLoading from "../pages/loading";
import * as PageProfile from "../pages/profile";
import * as Page404 from "../pages/404";
import * as PageTransition from "../states/page-transition";
import type Page from "../pages/page";

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
      404: Page404.page,
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
