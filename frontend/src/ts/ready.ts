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
import { Workbox } from "workbox-window";

ManualRestart.set();
UpdateConfig.loadFromLocalStorage();

if (window.location.hostname === "localhost") {
  $("#bottom .version .text").text("localhost");
  $("#bottom #versionGroup").removeClass("hidden");
  $("body").prepend(
    `<a class='button configureAPI' href='http://localhost:5005/configure/' target='_blank' aria-label="Configure API" data-balloon-pos="right"><i class="fas fa-fw fa-server"></i></a>`
  );
} else {
  Misc.getLatestReleaseFromGitHub().then((v) => {
    $("#bottom .version .text").text(v);
    $("#bottom #versionGroup").removeClass("hidden");
    NewVersionNotification.show(v);
  });
}

Focus.set(true, true);
$(document).ready(() => {
  CookiePopup.check();
  $("body").css("transition", "all .25s, transform .05s");
  if (Config.quickRestart === "tab" || Config.quickRestart === "esc") {
    $("#restartTestButton").addClass("hidden");
  }
  // if (!window.localStorage.getItem("merchbannerclosed")) {
  //   Notifications.addBanner(
  //     `Check out our merchandise, available at <a target="_blank" href="https://monkeytype.store/">monkeytype.store</a>`,
  //     1,
  //     "images/merchdropwebsite2.png",
  //     false,
  //     () => {
  //       window.localStorage.setItem("merchbannerclosed", "true");
  //     },
  //     true
  //   );
  // }

  if (!window.localStorage.getItem("merchbannerclosed2")) {
    Notifications.addBanner(
      `Three new merch designs, available at <a target="_blank" href="https://www.monkeytype.store/unisex-men-s-t-shirts/">monkeytype.store</a>`,
      1,
      "images/cutoutbanner.png",
      false,
      () => {
        window.localStorage.setItem("merchbannerclosed2", "true");
      },
      true
    );
  }
  $("#centerContent")
    .css("opacity", "0")
    .removeClass("hidden")
    .stop(true, true)
    .animate({ opacity: 1 }, 250);
  PSA.show();
  MonkeyPower.init();
});
