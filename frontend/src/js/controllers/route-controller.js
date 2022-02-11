import * as Funbox from "../test/funbox";
import * as PageController from "./../controllers/page-controller";
import Config from "../config";
import * as ActivePage from "./../states/active-page";

let mappedRoutes = {
  "/": "pageLoading",
  "/login": "pageLoading",
  "/settings": "pageLoading",
  "/about": "pageLoading",
  "/account": "pageAccount",
  "/verify": "pageLoading",
};

export function handleInitialPageClasses(pathname) {
  if (!mappedRoutes[pathname]) {
    pathname = "/";
  }
  let el = $(".page." + mappedRoutes[pathname]);
  $(el).removeClass("hidden");
  $(el).addClass("active");
  let pageName = "loading";
  if (pathname === "/account") pageName = "account";
  ActivePage.set(pageName);
}

(function (history) {
  var pushState = history.pushState;
  history.pushState = function (state) {
    if (Config.funbox === "memory" && state !== "/") {
      Funbox.resetMemoryTimer();
    }
    return pushState.apply(history, arguments);
  };
})(window.history);

$(window).on("popstate", (e) => {
  let state = e.originalEvent.state;
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
