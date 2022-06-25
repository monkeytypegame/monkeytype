import * as ManualRestart from "./test/manual-restart-tracker";
import Config, * as UpdateConfig from "./config";
import * as Misc from "./utils/misc";
import * as MonkeyPower from "./elements/monkey-power";
import * as NewVersionNotification from "./elements/version-check";
import * as Notifications from "./elements/notifications";
import * as Focus from "./test/focus";
import * as CookiePopup from "./popups/cookie-popup";
import { CLIENT_VERSION } from "./version";

ManualRestart.set();
UpdateConfig.loadFromLocalStorage();

if (window.location.hostname === "localhost") {
  $("#bottom .version .text").text("localhost");
  $("#bottom .version").css("opacity", 1);
  $("body").prepend(
    `<a class='button configureAPI' href='http://localhost:5005/configure/' target='_blank'><i class="fas fa-fw fa-server"></i>Configure Server</a>`
  );
} else {
  Misc.getReleasesFromGitHub().then((v) => {
    NewVersionNotification.show(v[0].name);
  });
}

$("#nocss .requestedStylesheets").html(
  "Requested stylesheets:<br>" +
    (
      [
        ...document.querySelectorAll("link[rel=stylesheet"),
      ] as HTMLAnchorElement[]
    )
      .map((l) => l.href)
      .filter((l) => /\/css\//gi.test(l))
      .join("<br>") +
    "<br><br>Client version:<br>" +
    CLIENT_VERSION
);

Focus.set(true, true);
$(document).ready(() => {
  CookiePopup.check();
  $("body").css("transition", "all .25s, transform .05s");
  if (Config.quickRestart === "tab" || Config.quickRestart === "esc") {
    $("#restartTestButton").addClass("hidden");
  }
  if (!window.localStorage.getItem("merchbannerclosed")) {
    Notifications.addBanner(
      `Check out our merchandise, available at <a target="_blank" href="https://monkeytype.store/">monkeytype.store</a>`,
      1,
      "images/merchdropwebsite2.png",
      false,
      () => {
        window.localStorage.setItem("merchbannerclosed", "true");
      },
      true
    );
  }
  $("#centerContent")
    .css("opacity", "0")
    .removeClass("hidden")
    .stop(true, true)
    .animate({ opacity: 1 }, 250);

  MonkeyPower.init();
});
