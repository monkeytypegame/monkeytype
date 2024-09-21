import Config from "./config";
import * as Misc from "./utils/misc";
import * as MonkeyPower from "./elements/monkey-power";
import * as MerchBanner from "./elements/merch-banner";
import * as CookiesModal from "./modals/cookies";
import * as ConnectionState from "./states/connection";
import * as AccountButton from "./elements/account-button";
import * as FunboxList from "./test/funbox/funbox-list";
//@ts-expect-error
import Konami from "konami";
import * as ServerConfiguration from "./ape/server-configuration";

$((): void => {
  Misc.loadCSS("/css/slimselect.min.css", true);
  Misc.loadCSS("/css/balloon.min.css", true);

  CookiesModal.check();

  //this line goes back to pretty much the beginning of the project and im pretty sure its here
  //to make sure the initial theme application doesnt animate the background color
  $("body").css("transition", "background .25s, transform .05s");
  MerchBanner.showIfNotClosedBefore();
  setTimeout(() => {
    FunboxList.get(Config.funbox).forEach((it) =>
      it.functions?.applyGlobalCSS?.()
    );
  }, 500); //this approach will probably bite me in the ass at some point

  $("#app")
    .css("opacity", "0")
    .removeClass("hidden")
    .stop(true, true)
    .animate({ opacity: 1 }, Misc.applyReducedMotion(250));
  if (ConnectionState.get()) {
    void ServerConfiguration.sync().then(() => {
      if (!ServerConfiguration.get()?.users.signUp) {
        AccountButton.hide();
        $(".register").addClass("hidden");
        $(".login").addClass("hidden");
        $(".disabledNotification").removeClass("hidden");
      }
    });
  }
  MonkeyPower.init();

  // untyped, need to ignore
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
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
