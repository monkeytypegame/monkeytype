import * as PageController from "./page-controller";
import * as PageTest from "../pages/test";
import * as PageAbout from "../pages/about";
import * as PageSettings from "../pages/settings";
import * as PageAccount from "../pages/account";
import * as PageLogin from "../pages/login";
import * as Page404 from "../pages/404";
import * as PageProfile from "../pages/profile";
import * as PageTribe from "../pages/tribe";
import * as Leaderboards from "../elements/leaderboards";
import * as TestUI from "../test/test-ui";
import * as PageTransition from "../states/page-transition";
// import * as ActivePage from "../states/active-page";
import { Auth } from "../firebase";
import * as Tribe from "../tribe/tribe";

//source: https://www.youtube.com/watch?v=OstALBk-jTc
// https://www.youtube.com/watch?v=OstALBk-jTc

interface NavigateOptions {
  tribeOverride?: boolean;
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
    load: (_params, navigateOptions): void => {
      if (Tribe.state >= 5 && !navigateOptions?.tribeOverride) {
        navigate("/tribe", navigateOptions);
      } else {
        PageController.change(PageTest.page, true);
      }
    },
  },
  {
    path: "/verify",
    load: (): void => {
      PageController.change(PageTest.page, true);
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
      PageController.change(PageAbout.page, true);
    },
  },
  {
    path: "/settings",
    load: (): void => {
      PageController.change(PageSettings.page, true);
    },
  },
  {
    path: "/login",
    load: (): void => {
      PageController.change(PageLogin.page, true);
    },
  },
  {
    path: "/account",
    load: (): void => {
      PageController.change(PageAccount.page, true);
    },
  },
  {
    path: "/profile",
    load: (): void => {
      if (Auth.currentUser) {
        navigate("/account");
      } else {
        navigate("/");
      }
    },
  },
  {
    path: "/profile/:uid",
    load: (params): void => {
      PageController.change(PageProfile.page, true, params);
    },
  },
  {
    path: "/tribe",
    load: (params): void => {
      PageController.change(PageTribe.page, true, params);
    },
  },
  {
    path: "/tribe/:roomId",
    load: (params): void => {
      Tribe.setAutoJoin(params["roomId"]);
      PageController.change(PageTribe.page, true, params);
    },
  },
];

export function navigate(
  url = window.location.pathname,
  options = {} as NavigateOptions
): void {
  if (Tribe.state > 5 && !options?.tribeOverride) return;
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
    if (target.matches("[data-link]") && target?.href) {
      e.preventDefault();
      navigate(target.href);
    }
  });
});

$("#top .logo").on("click", () => {
  navigate("/");
});

$(document).on("click", "#leaderboards .entryName", (e) => {
  const uid = $(e.target).attr("uid");
  if (uid) {
    navigate(`/profile/${uid}`);
    Leaderboards.hide();
  }
});
