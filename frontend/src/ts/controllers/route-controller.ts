import * as PageController from "./page-controller";
import * as TribeState from "../tribe/tribe-state";
import * as TestUI from "../test/test-ui";
import * as PageTransition from "../states/page-transition";
import { isAuthAvailable, isAuthenticated } from "../firebase";
import { isFunboxActive } from "../test/funbox/list";
import * as TestState from "../test/test-state";
import * as Notifications from "../elements/notifications";
import tribeSocket from "../tribe/tribe-socket";
import { setAutoJoin } from "../tribe/tribe-auto-join";
import { LoadingOptions } from "../pages/page";
import { setNavigationService } from "../observables/navigate-event";

//source: https://www.youtube.com/watch?v=OstALBk-jTc
// https://www.youtube.com/watch?v=OstALBk-jTc

type NavigateOptions = {
  force?: boolean;
  tribeOverride?: boolean;
  data?: unknown;
  loadingOptions?: LoadingOptions;
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
  ) => Promise<void>;
};

const route404: Route = {
  path: "404",
  load: async (_params, options) => {
    await PageController.change("404", options);
  },
};

const routes: Route[] = [
  {
    path: "/",
    load: async (_params, options): Promise<void> => {
      if (options?.tribeOverride === true) {
        await PageController.change("test", {
          tribeOverride: options?.tribeOverride ?? false,
          force: options?.force ?? false,
        });
        return;
      }

      if (TribeState.getState() >= 5) {
        if (TribeState.getState() === 22 && TribeState.getSelf()?.isLeader) {
          tribeSocket.out.room.backToLobby();
        } else {
          await navigate("/tribe", options);
        }
      } else {
        await PageController.change("test", {
          tribeOverride: options?.tribeOverride ?? false,
          force: options?.force ?? false,
        });
      }
    },
  },
  {
    path: "/verify",
    load: async (_params, options) => {
      await PageController.change("test", options);
    },
  },
  {
    path: "/leaderboards",
    load: async (_params, options) => {
      await PageController.change("leaderboards", options);
    },
  },
  {
    path: "/about",
    load: async (_params, options) => {
      await PageController.change("about", options);
    },
  },
  {
    path: "/settings",
    load: async (_params, options) => {
      await PageController.change("settings", options);
    },
  },
  {
    path: "/login",
    load: async (_params, options) => {
      if (!isAuthAvailable()) {
        await navigate("/", options);
        return;
      }
      if (isAuthenticated()) {
        await navigate("/account", options);
        return;
      }
      await PageController.change("login", options);
    },
  },
  {
    path: "/account",
    load: async (_params, options) => {
      if (!isAuthAvailable()) {
        await navigate("/", options);
        return;
      }
      if (!isAuthenticated()) {
        await navigate("/login", options);
        return;
      }
      await PageController.change("account", options);
    },
  },
  {
    path: "/account-settings",
    load: async (_params, options) => {
      if (!isAuthAvailable()) {
        await navigate("/", options);
        return;
      }
      if (!isAuthenticated()) {
        await navigate("/login", options);
        return;
      }
      await PageController.change("accountSettings", options);
    },
  },
  {
    path: "/profile",
    load: async (_params, options) => {
      await PageController.change("profileSearch", options);
    },
  },
  {
    path: "/profile/:uidOrName",
    load: async (params, options) => {
      await PageController.change("profile", {
        ...options,
        force: true,
        params: {
          uidOrName: params["uidOrName"] as string,
        },
        data: options.data,
      });
    },
  },
  {
    path: "/friends",
    load: async (_params, options) => {
      if (!isAuthAvailable()) {
        await navigate("/", options);
        return;
      }
      if (!isAuthenticated()) {
        await navigate("/login", options);
        return;
      }

      await PageController.change("friends", options);
    },
  },
  {
    path: "/tribe",
    load: async (params, options): Promise<void> => {
      if (options?.tribeOverride === true) {
        await PageController.change("tribe", {
          tribeOverride: options?.tribeOverride ?? false,
          force: options?.force ?? false,
          params,
        });
        return;
      }

      if (TribeState.getState() === 22 && TribeState.getSelf()?.isLeader) {
        tribeSocket.out.room.backToLobby();
      } else {
        await PageController.change("tribe", {
          tribeOverride: options?.tribeOverride ?? false,
          force: options?.force ?? false,
          params,
        });
      }
    },
  },
  {
    path: "/tribe/:roomId",
    load: async (params): Promise<void> => {
      setAutoJoin(params["roomId"] as string);
      await PageController.change("tribe", {
        force: true,
        params,
      });
    },
  },
];

export async function navigate(
  url = window.location.pathname +
    window.location.search +
    window.location.hash,
  options = {} as NavigateOptions
): Promise<void> {
  if (
    TribeState.getState() > 5 &&
    TribeState.getState() < 22 &&
    !options?.tribeOverride
  ) {
    return;
  }
  if (
    !options.force &&
    (TestState.testRestarting ||
      TestUI.resultCalculating ||
      PageTransition.get())
  ) {
    console.debug(
      `navigate: ${url} ignored, page is busy (testRestarting: ${
        TestState.testRestarting
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
    //todo: figure out if this was ever used
    // event?.preventDefault();
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

  await router(options);
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
    await route404.load(
      {},
      {
        force: true,
      }
    );
    return;
  }

  await match.route.load(getParams(match), options);
}

window.addEventListener("popstate", () => {
  void router();
});

document.addEventListener("DOMContentLoaded", () => {
  document.body.addEventListener("click", (e) => {
    const target = e?.target as HTMLLinkElement;
    if (target.matches("[router-link]") && target?.href) {
      e.preventDefault();
      void navigate(target.href);
    }
  });
});

// Register navigation service for modules that can't directly import navigate
// due to circular dependency constraints
setNavigationService({
  navigate(url, options) {
    void navigate(url, options);
  },
});
