import * as PageController from "./page-controller";
import * as TestUI from "../test/test-ui";
import * as PageTransition from "../states/page-transition";
import { isAuthAvailable, isAuthenticated } from "../firebase";
import { isFunboxActive } from "../test/funbox/list";
import * as TestState from "../test/test-state";
import * as Notifications from "../elements/notifications";
import { LoadingOptions } from "../pages/page";

//source: https://www.youtube.com/watch?v=OstALBk-jTc
// https://www.youtube.com/watch?v=OstALBk-jTc

//this will be used in tribe
type NavigateOptions = {
  empty?: boolean;
  data?: unknown;
  overrideLoadingOptions?: LoadingOptions;
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
    load: (_params, options): void => {
      void PageController.change("test", options);
    },
  },
  {
    path: "/verify",
    load: (_params, options): void => {
      void PageController.change("test", options);
    },
  },
  {
    path: "/leaderboards",
    load: (_params, options): void => {
      void PageController.change("leaderboards", options);
    },
  },
  {
    path: "/about",
    load: (_params, options): void => {
      void PageController.change("about", options);
    },
  },
  {
    path: "/settings",
    load: (_params, options): void => {
      void PageController.change("settings", options);
    },
  },
  {
    path: "/login",
    load: (_params, options): void => {
      if (!isAuthAvailable()) {
        navigate("/", options);
        return;
      }

      if (isAuthenticated()) {
        navigate("/account", options);
        return;
      }
      void PageController.change("login", options);
    },
  },
  {
    path: "/account",
    load: (_params, options): void => {
      if (!isAuthAvailable()) {
        navigate("/", options);
        return;
      }

      void PageController.change("account", options);
    },
  },
  {
    path: "/account-settings",
    load: (_params, options): void => {
      if (!isAuthAvailable()) {
        navigate("/", options);
        return;
      }

      if (!isAuthenticated()) {
        navigate("/login", options);
        return;
      }
      void PageController.change("accountSettings", options);
    },
  },
  {
    path: "/profile",
    load: (_params, options): void => {
      void PageController.change("profileSearch", options);
    },
  },
  {
    path: "/profile/:uidOrName",
    load: (params, options): void => {
      void PageController.change("profile", {
        ...options,
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
  url = window.location.pathname +
    window.location.search +
    window.location.hash,
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

  const noQuit = isFunboxActive("no_quit");
  if (TestState.isActive && noQuit) {
    Notifications.add("No quit funbox is active. Please finish the test.", 0, {
      important: true,
    });
    event?.preventDefault();
    return;
  }

  url = url.replace(/\/$/, "");
  if (url === "") url = "/";

  // only push to history if we're navigating to a different URL
  const currentUrl = new URL(window.location.href);
  const targetUrl = new URL(url, window.location.origin);

  if (
    currentUrl.pathname + currentUrl.search + currentUrl.hash !==
    targetUrl.pathname + targetUrl.search + targetUrl.hash
  ) {
    history.pushState(null, "", url);
  }

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
