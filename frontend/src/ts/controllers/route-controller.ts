// import * as Funbox from "../test/funbox";
import * as PageController from "./page-controller";
import PageTest from "../pages/test";
// import Config from "../config";
// import * as ActivePage from "../states/active-page";
// import { Auth } from "../firebase";

// const mappedRoutes = {
//   "/": "pageLoading",
//   "/login": "pageLoading",
//   "/settings": "pageLoading",
//   "/about": "pageLoading",
//   "/account": "pageAccount",
//   "/verify": "pageLoading",
//   "/profile": "pageLoading",
// };

// export function handleInitialPageClasses(pathname: string): void {
//   if (!mappedRoutes[pathname as keyof typeof mappedRoutes]) {
//     pathname = "/";
//   }
//   const el = $(".page." + mappedRoutes[pathname as keyof typeof mappedRoutes]);
//   $(el).removeClass("hidden");
//   $(el).addClass("active");
//   let pageName = "loading";
//   if (pathname === "/account") pageName = "account";
//   ActivePage.set(pageName as MonkeyTypes.Page);
// }

// honestly im not sure what this does
// (function (history): void {
//   const pushState = history.pushState;
//   history.pushState = function (state): void {
//     if (Config.funbox === "memory" && state !== "/") {
//       Funbox.resetMemoryTimer();
//     }
//     // @ts-ignore
//     return pushState.apply(history, arguments);
//   };
// })(window.history);

// $(window).on("popstate", (e) => {
//   const state = (e.originalEvent as unknown as PopStateEvent).state;
//   if (state == "" || state == "/") {
//     // show test
//     PageController.change("test");
//   } else if (state == "about") {
//     // show about
//     PageController.change("about");
//   } else if (state === "account" || state === "login") {
//     if (Auth.currentUser) {
//       PageController.change("account");
//     } else {
//       PageController.change("login");
//     }
//   }
// });

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
      PageController.change(PageTest);
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

  let match = matches.find((m) => m.result !== null) as {
    route: Route;
    result: RegExpMatchArray;
  };

  if (!match) {
    match = {
      route: {
        path: "/404",
        load: (_params): void => {
          alert("404");
        },
      },
      result: [location.pathname] as RegExpMatchArray,
    };
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
  // router();
});
