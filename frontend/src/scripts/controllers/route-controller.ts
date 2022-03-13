// import * as Funbox from "../test/funbox";
import * as PageController from "./page-controller";
// import Config from "../config";
import * as ActivePage from "../states/active-page";

const mappedRoutes = {
  "/": "pageLoading",
  "/login": "pageLoading",
  "/settings": "pageLoading",
  "/about": "pageLoading",
  "/account": "pageAccount",
  "/verify": "pageLoading",
};

export function handleInitialPageClasses(pathname: string): void {
  if (!mappedRoutes[pathname as keyof typeof mappedRoutes]) {
    pathname = "/";
  }
  const el = $(".page." + mappedRoutes[pathname as keyof typeof mappedRoutes]);
  $(el).removeClass("hidden");
  $(el).addClass("active");
  let pageName = "loading";
  if (pathname === "/account") pageName = "account";
  ActivePage.set(pageName as MonkeyTypes.Page);
}

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

$(window).on("popstate", (e) => {
  const state = (e.originalEvent as unknown as PopStateEvent).state;
  if (state == "" || state == "/") {
    // show test
    PageController.change("test");
  } else if (state == "about") {
    // show about
    PageController.change("about");
  } else if (state == "account" || state == "login") {
    if (firebase.auth().currentUser) {
      PageController.change("account");
    } else {
      PageController.change("login");
    }
  }
});
