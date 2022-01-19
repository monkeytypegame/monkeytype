import * as ManualRestart from "./manual-restart-tracker";
import Config, * as UpdateConfig from "./config";
import * as Misc from "./misc";
import * as VerificationController from "./verification-controller";
import * as Settings from "./settings";
import * as RouteController from "./route-controller";
import * as UI from "./ui";
import * as SignOutButton from "./sign-out-button";
import * as MonkeyPower from "./monkey-power";
import * as NewVersionNotification from "./new-version-notification";
import * as Notifications from "./notifications";

ManualRestart.set();
Misc.migrateFromCookies();
UpdateConfig.loadFromLocalStorage();
if (window.location.hostname === "localhost") {
  $("#bottom .version .text").text("localhost");
  $("#bottom .version").css("opacity", 1);
} else {
  Misc.getReleasesFromGitHub().then((v) => {
    NewVersionNotification.show(v[0].name);
  });
}

RouteController.handleInitialPageClasses(window.location.pathname);
$(document).ready(() => {
  if (window.location.pathname === "/") {
    // $("#top .config").removeClass("hidden");
  }
  $("body").css("transition", "all .25s, transform .05s");
  if (Config.quickTab) {
    $("#restartTestButton").addClass("hidden");
  }
  if (!window.localStorage.getItem("merchbannerclosed")) {
    Notifications.addBanner(
      `Checkout our merchandise, available at <a target="_blank" href="https://monkeytype.store/">monkeytype.store</a>`,
      1,
      "images/merchdropwebsite2.png",
      false,
      () => {
        window.localStorage.setItem("merchbannerclosed", true);
      }
    );
  }
  $("#centerContent")
    .css("opacity", "0")
    .removeClass("hidden")
    .stop(true, true)
    .animate({ opacity: 1 }, 250, () => {
      if (window.location.pathname === "/account") {
        SignOutButton.show();
      }
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
        let page = window.location.pathname.replace("/", "");
        UI.changePage(page);
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
  MonkeyPower.init();
});
