import * as Misc from "../utils/misc";
import * as ActivePage from "../states/active-page";
import * as Settings from "../pages/settings";
import * as Account from "../pages/account";
import * as ManualRestart from "../test/manual-restart-tracker";
import * as PageTest from "../pages/test";
import * as PageAbout from "../pages/about";
import * as PageLogin from "../pages/login";
import * as PageLoading from "../pages/loading";
import * as PageTransition from "../states/page-transition";
import { Auth } from "../firebase";

export async function change(
  page?: MonkeyTypes.Page | "",
  force = false
): Promise<void> {
  return new Promise((resolve) => {
    if (PageTransition.get()) {
      console.log(`change page ${page} stopped`);
      return;
    }
    console.log(`change page ${page}`);

    if (page === "") page = "test";
    if (page == undefined) {
      //use window loacation
      const pages: {
        [key: string]: MonkeyTypes.Page;
      } = {
        "/": "test",
        "/login": "login",
        "/settings": "settings",
        "/about": "about",
        "/account": "account",
      };
      let path = pages[window.location.pathname as keyof typeof pages];
      if (!path) {
        path = "test";
      }
      page = path;

      if (Auth.currentUser && page === "login") {
        page = "account";
      }
    }

    if (!force && ActivePage.get() === page) {
      console.log(`page ${page} already active`);
      return;
    }

    const pages = {
      loading: PageLoading.page,
      test: PageTest.page,
      settings: Settings.page,
      about: PageAbout.page,
      account: Account.page,
      login: PageLogin.page,
    };

    const previousPage = pages[ActivePage.get() as MonkeyTypes.Page];
    const nextPage = pages[page];

    previousPage?.beforeHide();
    PageTransition.set(true);
    ActivePage.set(undefined);
    $(".page").removeClass("active");
    Misc.swapElements(
      previousPage.element,
      nextPage.element,
      250,
      () => {
        PageTransition.set(false);
        ActivePage.set(nextPage.name);
        previousPage?.afterHide();
        nextPage.element.addClass("active");
        resolve();
        history.pushState(nextPage.pathname, "", nextPage.pathname);
        nextPage?.afterShow();
      },
      async () => {
        await nextPage?.beforeShow();
      }
    );
  });
}

$(document).on("click", "#top .logo", () => {
  change("test");
});

$(document).on("click", "#top #menu .text-button", (e) => {
  if (!$(e.currentTarget).hasClass("leaderboards")) {
    const href = $(e.currentTarget).attr("href") as string;
    ManualRestart.set();
    change(href.replace("/", "") as MonkeyTypes.Page);
  }
  return false;
});

$(".pageTest .loginTip .link").on("click", async () => {
  change("login");
});
