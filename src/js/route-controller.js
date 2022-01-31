import * as Funbox from "./funbox";
import * as UI from "./ui";
import Config from "./config";

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
  UI.setActivePage(mappedRoutes[pathname]);
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
    UI.changePage("test");
  } else if (state == "about") {
    // show about
    UI.changePage("about");
  } else if (state == "account" || state == "login") {
    if (firebase.auth().currentUser) {
      UI.changePage("account");
    } else {
      UI.changePage("login");
    }
  }
});
