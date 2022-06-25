import * as PageController from "./page-controller";
import * as PageTest from "../pages/test";
import * as PageAbout from "../pages/about";
import * as PageSettings from "../pages/settings";
import * as PageAccount from "../pages/account";
import * as PageLogin from "../pages/login";
import * as Page404 from "../pages/404";
import * as PageProfile from "../pages/profile";
import * as Leaderboards from "../elements/leaderboards";
import * as ActivePage from "../states/active-page";
import { Auth } from "../firebase";

//source: https://www.youtube.com/watch?v=OstALBk-jTc
// https://www.youtube.com/watch?v=OstALBk-jTc

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
  load: (params: { [key: string]: string }) => void;
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
  {
    path: "/leaderboards",
    load: (): void => {
      if (ActivePage.get() === "loading") {
        PageController.change(PageTest.page);
      }
      Leaderboards.show();
    },
  },
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
      PageController.change(PageLogin.page);
    },
  },
  {
    path: "/account",
    load: (): void => {
      PageController.change(PageAccount.page);
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
      PageController.change(PageProfile.page, undefined, params);
    },
  },
];

export function navigate(url = window.location.pathname): void {
  history.pushState(null, "", url);
  router();
}

async function router(): Promise<void> {
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

  match.route.load(getParams(match));
}

window.addEventListener("popstate", router);

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

$("#leaderboards .entryName").on("click", (e) => {
  const uid = $(e.target).attr("uid");
  if (uid) {
    navigate(`/profile/${uid}`);
    Leaderboards.hide();
  }
});
