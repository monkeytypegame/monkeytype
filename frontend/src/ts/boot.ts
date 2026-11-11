import * as ServerConfiguration from "./ape/server-configuration";
import { configLoadPromise } from "./config/lifecycle";
import * as MerchBanner from "./elements/merch-banner";
import * as Psa from "./elements/psa";
import { authPromise } from "./firebase";
import { initConnection } from "./states/connection";
import { setAppReady } from "./states/core";
import { isDevEnvironment } from "./utils/env";

/** App startup work that doesn't touch the DOM. Call once, right after render. */
export async function boot(): Promise<void> {
  // before awaiting: PSAs show on the first auth state change
  initConnection();
  Psa.init();

  await configLoadPromise;
  await authPromise;

  MerchBanner.showIfNotClosedBefore();

  setAppReady(true);

  void ServerConfiguration.sync();

  registerServiceWorker();
}

function registerServiceWorker(): void {
  if (isDevEnvironment()) {
    void navigator.serviceWorker
      .getRegistrations()
      .then(function (registrations) {
        for (const registration of registrations) {
          void registration.unregister();
        }
      });
  } else {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js", { scope: "/" })
          .then((registration) => {
            console.log(
              "ServiceWorker registration successful with scope: ",
              registration.scope,
            );
          })
          .catch((error: unknown) => {
            console.error("ServiceWorker registration failed: ", error);
          });
      });
    }
  }
}
