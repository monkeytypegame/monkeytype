import * as ManualRestart from "./test/manual-restart-tracker";
import Config, * as UpdateConfig from "./config";
import * as Misc from "./utils/misc";
import * as MonkeyPower from "./elements/monkey-power";
import * as NewVersionNotification from "./elements/version-check";
import * as Notifications from "./elements/notifications";
import * as Focus from "./test/focus";
import * as CookiePopup from "./popups/cookie-popup";
import * as PSA from "./elements/psa";
import * as ConnectionState from "./states/connection";
import * as FunboxList from "./test/funbox/funbox-list";
//@ts-expect-error
import Konami from "konami";
import { log } from "./controllers/analytics-controller";
import { envConfig } from "./constants/env-config";
import * as ServerConfiguration from "./ape/server-configuration";

if (Misc.isDevEnvironment()) {
  $("footer .currentVersion .text").text("localhost");
  $("body").prepend(
    `<a class='button configureAPI' href='${envConfig.backendUrl}/configure/' target='_blank' aria-label="Configure API" data-balloon-pos="right"><i class="fas fa-fw fa-server"></i></a>`
  );
} else {
  Misc.getLatestReleaseFromGitHub()
    .then((v) => {
      $("footer .currentVersion .text").text(v);
      void NewVersionNotification.show(v);
    })
    .catch((e) => {
      $("footer .currentVersion .text").text("unknown");
    });
}

ManualRestart.set();
void UpdateConfig.loadFromLocalStorage();
Focus.set(true, true);

$(document).ready(() => {
  Misc.loadCSS("/css/slimselect.min.css", true);
  Misc.loadCSS("/css/balloon.min.css", true);
  Misc.loadCSS("/css/fa.min.css", true);

  CookiePopup.check();

  $("body").css("transition", "background .25s, transform .05s");
  if (Config.quickRestart !== "off") {
    $("#restartTestButton").addClass("hidden");
  }
  const merchBannerClosed =
    window.localStorage.getItem("merchbannerclosed") === "true";
  if (!merchBannerClosed) {
    Notifications.addBanner(
      `Check out our merchandise, available at <a target="_blank" rel="noopener" href="https://monkeytype.store/">monkeytype.store</a>`,
      1,
      "./images/merch2.png",
      false,
      () => {
        window.localStorage.setItem("merchbannerclosed", "true");
      },
      true
    );
  }

  // if (!window.localStorage.getItem("merchbannerclosed2")) {
  //   Notifications.addBanner(
  //     `Three new merch designs, available at <a target="_blank" href="https://www.monkeytype.store/unisex-men-s-t-shirts/">monkeytype.store</a>`,
  //     1,
  //     "images/cutoutbanner.png",
  //     false,
  //     () => {
  //       window.localStorage.setItem("merchbannerclosed2", "true");
  //     },
  //     true
  //   );
  // }

  setTimeout(() => {
    FunboxList.get(Config.funbox).forEach((it) =>
      it.functions?.applyGlobalCSS?.()
    );
  }, 500); //this approach will probably bite me in the ass at some point

  $("#contentWrapper")
    .css("opacity", "0")
    .removeClass("hidden")
    .stop(true, true)
    .animate({ opacity: 1 }, 250);
  if (ConnectionState.get()) {
    void PSA.show();
    void ServerConfiguration.sync();
  }
  MonkeyPower.init();

  new Konami("https://keymash.io/");

  if (Misc.isDevEnvironment()) {
    void navigator.serviceWorker
      .getRegistrations()
      .then(function (registrations) {
        for (const registration of registrations) {
          void registration.unregister();
        }
      });
  }
});

window.onerror = function (message, url, line, column, error): void {
  void log("error", {
    error: error?.stack ?? "",
  });
};

window.onunhandledrejection = function (e): void {
  void log("error", {
    error: e.reason.stack ?? "",
  });
};
