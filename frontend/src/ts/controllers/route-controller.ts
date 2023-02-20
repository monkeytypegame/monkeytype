import * as PageController from "./page-controller";
import * as PageTest from "../pages/test";
import * as PageAbout from "../pages/about";
import * as PageSettings from "../pages/settings";
import * as PageAccount from "../pages/account";
import * as PageLogin from "../pages/login";
import * as Page404 from "../pages/404";
import * as PageProfile from "../pages/profile";
import * as PageProfileSearch from "../pages/profile-search";
import * as Leaderboards from "../elements/leaderboards";
import * as TestUI from "../test/test-ui";
import * as PageTransition from "../states/page-transition";
import * as NavigateEvent from "../observables/navigate-event";
import { Auth } from "../firebase";

//source: https://www.youtube.com/watch?v=OstALBk-jTc
// https://www.youtube.com/watch?v=OstALBk-jTc

//this will be used in tribe
interface NavigateOptions {
  empty?: boolean;
  data?: any;
}

function pathToRegex(path: string): RegExp {
  return new RegExp(
    "^" + path.replace(/\//g, "\\/").replace(/:\w+/g, "(.+)") + "$"
  );
}

function getParams(match: { route: Route; result: RegExpMatchArray }): {
  [key: string]: string;
} {
  const values = match.result.slice(1);
  const keys = Array.from(match.route.path.matchAll(/:(\w+)/g)).map(
    (result) => result[1]
  );

  return Object.fromEntries(keys.map((key, index) => [key, values[index]]));
}

interface Route {
  path: string;
  load: (
    params: { [key: string]: string },
    navigateOptions: NavigateOptions
  ) => void;
}

const routes: Route[] = [
  {
    path: "/",
    load: (): void => {
      PageController.change(PageTest.page);
    },
  },
  {
    path: "/verify",
    load: (): void => {
      PageController.change(PageTest.page);
    },
  },
  // {
  //   path: "/leaderboards",
  //   load: (): void => {
  //     if (ActivePage.get() === "loading") {
  //       PageController.change(PageTest.page);
  //     }
  //     Leaderboards.show();
  //   },
  // },
  {
    path: "/about",
    load: (): void => {
      PageController.change(PageAbout.page);
    },
  },
  {
    path: "/settings",
    load: (): void => {
      PageController.change(PageSettings.page);
    },
  },
  {
    path: "/login",
    load: (): void => {
      if (!Auth) {
        nav("/");
        return;
      }
      if (Auth.currentUser) {
        nav("/account");
        return;
      }
      PageController.change(PageLogin.page);
    },
  },
  {
    path: "/account",
    load: (_params, options): void => {
      if (!Auth) {
        nav("/");
        return;
      }
      PageController.change(PageAccount.page, {
        data: options.data,
      });
    },
  },
  {
    path: "/profile",
    load: (_params): void => {
      PageController.change(PageProfileSearch.page);
    },
  },
  {
    path: "/profile/:uidOrName",
    load: (params, options): void => {
      PageController.change(PageProfile.page, {
        force: true,
        params: {
          uidOrName: params["uidOrName"],
        },
        data: options.data,
      });
    },
  },
];

function nav(
  url = window.location.pathname + window.location.search,
  options = {} as NavigateOptions
): void {
  if (
    TestUI.testRestarting ||
    TestUI.resultCalculating ||
    PageTransition.get()
  ) {
    return;
  }
  url = url.replace(/\/$/, "");
  if (url === "") url = "/";
  history.pushState(null, "", url);
  router(options);
}

async function router(options = {} as NavigateOptions): Promise<void> {
  const matches = routes.map((r) => {
    return {
      route: r,
      result: location.pathname.match(pathToRegex(r.path)),
    };
  });

  const match = matches.find((m) => m.result !== null) as {
    route: Route;
    result: RegExpMatchArray;
  };

  if (!match) {
    PageController.change(Page404.page);
    return;
  }

  match.route.load(getParams(match), options);
}

window.addEventListener("popstate", () => {
  router();
});

document.addEventListener("DOMContentLoaded", () => {
  document.body.addEventListener("click", (e) => {
    const target = e?.target as HTMLLinkElement;
    if (target.matches("[router-link]") && target?.href) {
      e.preventDefault();
      nav(target.href);
    }
  });
});

$("#top .logo").on("click", () => {
  nav("/");
});

$("#popups").on("click", "#leaderboards a.entryName", () => {
  Leaderboards.hide();
});

NavigateEvent.subscribe((url, options) => {
  nav(url, options);
});
