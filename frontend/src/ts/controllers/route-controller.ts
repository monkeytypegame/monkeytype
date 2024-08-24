import * as PageController from "./page-controller";
import * as Leaderboards from "../elements/leaderboards";
import * as TestUI from "../test/test-ui";
import * as PageTransition from "../states/page-transition";
import { Auth, isAuthenticated } from "../firebase";

//source: https://www.youtube.com/watch?v=OstALBk-jTc
// https://www.youtube.com/watch?v=OstALBk-jTc

//this will be used in tribe
type NavigateOptions = {
  empty?: boolean;
  data?: unknown;
};

function pathToRegex(path: string): RegExp {
  return new RegExp(
    "^" + path.replace(/\//g, "\\/").replace(/:\w+/g, "(.+)") + "$"
  );
}

function getParams(match: {
  route: Route;
  result: RegExpMatchArray;
}): Record<string, string> {
  const values = match.result.slice(1);
  const keys = Array.from(match.route.path.matchAll(/:(\w+)/g)).map(
    (result) => result[1]
  );

  const a = keys.map((key, index) => [key, values[index]]);
  return Object.fromEntries(a) as Record<string, string>;
}

type Route = {
  path: string;
  load: (
    params: Record<string, string>,
    navigateOptions: NavigateOptions
  ) => void;
};

const route404: Route = {
  path: "404",
  load: (): void => {
    void PageController.change("404");
  },
};

const routes: Route[] = [
  {
    path: "/",
    load: (): void => {
      void PageController.change("test");
    },
  },
  {
    path: "/verify",
    load: (): void => {
      void PageController.change("test");
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
      void PageController.change("about");
    },
  },
  {
    path: "/settings",
    load: (): void => {
      void PageController.change("settings");
    },
  },
  {
    path: "/login",
    load: (): void => {
      if (!Auth) {
        navigate("/");
        return;
      }
      if (isAuthenticated()) {
        navigate("/account");
        return;
      }
      void PageController.change("login");
    },
  },
  {
    path: "/account",
    load: (_params, options): void => {
      if (!Auth) {
        navigate("/");
        return;
      }
      void PageController.change("account", {
        data: options.data,
      });
    },
  },
  {
    path: "/account-settings",
    load: (_params, options): void => {
      if (!Auth) {
        navigate("/");
        return;
      }
      if (!isAuthenticated()) {
        navigate("/login");
        return;
      }
      void PageController.change("accountSettings", {
        data: options.data,
      });
    },
  },
  {
    path: "/profile",
    load: (_params): void => {
      void PageController.change("profileSearch");
    },
  },
  {
    path: "/profile/:uidOrName",
    load: (params, options): void => {
      void PageController.change("profile", {
        force: true,
        params: {
          uidOrName: params["uidOrName"] as string,
        },
        data: options.data,
      });
    },
  },
];

export function navigate(
  url = window.location.pathname + window.location.search,
  options = {} as NavigateOptions
): void {
  if (
    TestUI.testRestarting ||
    TestUI.resultCalculating ||
    PageTransition.get()
  ) {
    console.debug(
      `navigate: ${url} ignored, page is busy (testRestarting: ${
        TestUI.testRestarting
      }, resultCalculating: ${
        TestUI.resultCalculating
      }, pageTransition: ${PageTransition.get()})`
    );
    return;
  }
  url = url.replace(/\/$/, "");
  if (url === "") url = "/";
  history.pushState(null, "", url);
  void router(options);
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

  if (match === undefined) {
    route404.load({}, {});
    return;
  }

  match.route.load(getParams(match), options);
}

window.addEventListener("popstate", () => {
  void router();
});

document.addEventListener("DOMContentLoaded", () => {
  document.body.addEventListener("click", (e) => {
    const target = e?.target as HTMLLinkElement;
    if (target.matches("[router-link]") && target?.href) {
      e.preventDefault();
      navigate(target.href);
    }
  });
});

$("#popups").on("click", "#leaderboards a.entryName", () => {
  Leaderboards.hide();
});
