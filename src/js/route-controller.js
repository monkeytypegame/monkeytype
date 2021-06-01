import * as Funbox from "./funbox";
import * as UI from "./ui";

let mappedRoutes = {
  "/": "pageTest",
  "/login": "pageLogin",
  "/settings": "pageSettings",
  "/about": "pageAbout",
  "/account": "pageAccount",
  "/verify": "pageTest",
};

export function handleInitialPageClasses(pathname) {
  let el = $(".page." + mappedRoutes[pathname]);
  $(el).removeClass("hidden");
  $(el).addClass("active");
}

(function (history) {
  var pushState = history.pushState;
  history.pushState = function (state) {
    if (Funbox.active === "memory" && state !== "/") {
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
