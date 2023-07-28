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
import * as FunboxList from "./test/funbox/funbox-list";
//@ts-ignore
import Konami from "konami";

ManualRestart.set();
UpdateConfig.loadFromLocalStorage();

if (Misc.isLocalhost()) {
  $("head title").text("localhost");
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
  Misc.loadCSS("/./css/select2.min.css", true);
  Misc.loadCSS("/./css/balloon.min.css", true);
  Misc.loadCSS("/./css/fa.min.css", true);

  CookiePopup.check();
  $("body").css("transition", "all .25s, transform .05s");
  if (Config.quickRestart === "tab" || Config.quickRestart === "esc") {
    $("#restartTestButton").addClass("hidden");
  }
  if (!window.localStorage.getItem("merchbannerclosed")) {
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

  FunboxList.get(Config.funbox).forEach((it) =>
    it.functions?.applyGlobalCSS?.()
  );

  $("#centerContent")
    .css("opacity", "0")
    .removeClass("hidden")
    .stop(true, true)
    .animate({ opacity: 1 }, 250);
  if (ConnectionState.get()) PSA.show();
  MonkeyPower.init();

  new Konami("https://keymash.io/");
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    // disabling service workers on localhost - they dont really work well with local development
    // and cause issues with hot reloading
    if (Misc.isLocalhost()) {
      navigator.serviceWorker.getRegistrations().then(function (registrations) {
        for (const registration of registrations) {
          // if (registration.scope !== "https://monkeytype.com/")
          registration.unregister();
        }
      });
    } else {
      const wb = new Workbox("/service-worker.js");

      let updateBannerId: number;

      // Add an event listener to detect when the registered
      // service worker has installed but is waiting to activate.
      wb.addEventListener("waiting", (event) => {
        // set up a listener that will show a banner as soon as
        // the previously waiting service worker has taken control.
        wb.addEventListener("controlling", (event2) => {
          if (
            (event.isUpdate || event2.isUpdate) &&
            updateBannerId === undefined
          ) {
            // updateBannerId = Notifications.addBanner(
            //   "Update ready - please refresh",
            //   1,
            //   "gift",
            //   true
            // );
          }
        });

        wb.messageSkipWaiting();
      });

      wb.register()
        .then((registration) => {
          // if (registration?.waiting) {
          //   //@ts-ignore
          //   registration?.onupdatefound = (): void => {
          //     Notifications.add("Downloading update...", 1, 0, "Update");
          //   };
          // }
          console.log("Service worker registration succeeded:", registration);

          setInterval(() => {
            wb.update(); //check for updates every 15 minutes
          }, 900000);
        })
        .catch((e) => {
          console.log("Service worker registration failed:", e);
        });
    }
  });
}
