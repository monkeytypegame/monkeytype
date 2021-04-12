import * as ManualRestart from "./manual-restart-tracker";
import Config, * as UpdateConfig from "./config";
import * as Misc from "./misc";
import * as VerificationController from "./verification-controller";
import * as Settings from "./settings";
import * as RouteController from "./route-controller";
import * as UI from "./ui";

ManualRestart.set();
Misc.migrateFromCookies();
UpdateConfig.loadFromLocalStorage();
Misc.getReleasesFromGitHub();

$(document).ready(() => {
  RouteController.handleInitialPageClasses(window.location.pathname);
  if (window.location.pathname === "/") {
    $("#top .config").removeClass("hidden");
  }
  $("body").css("transition", ".25s");
  if (Config.quickTab) {
    $("#restartTestButton").addClass("hidden");
  }
  if (!window.localStorage.getItem("merchbannerclosed")) {
    $(".merchBanner").removeClass("hidden");
  } else {
    $(".merchBanner").remove();
  }
  $("#centerContent")
    .css("opacity", "0")
    .removeClass("hidden")
    .stop(true, true)
    .animate({ opacity: 1 }, 250, () => {
      if (window.location.pathname === "/verify") {
        const fragment = new URLSearchParams(window.location.hash.slice(1));
        if (fragment.has("access_token")) {
          const accessToken = fragment.get("access_token");
          const tokenType = fragment.get("token_type");
          VerificationController.set({
            accessToken: accessToken,
            tokenType: tokenType,
          });
          history.replaceState("/", null, "/");
        }
      } else if (window.location.pathname === "/account") {
        // history.replaceState("/", null, "/");
      } else if (/challenge_.+/g.test(window.location.pathname)) {
        //do nothing
        // }
      } else if (window.location.pathname !== "/") {
        let page = window.location.pathname.replace("/", "");
        UI.changePage(page);
      }
    });
  Settings.settingsFillPromise.then(Settings.update);
});
