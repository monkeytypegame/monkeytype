import * as ServerConfiguration from "./ape/server-configuration";
import { loadFromLocalStorage } from "./config/lifecycle";
import * as Cookies from "./cookies";
import * as MerchBanner from "./elements/merch-banner";
import * as PwaInstallBanner from "./elements/pwa-install-banner";
import * as Psa from "./elements/psa";
import { startAuth } from "./auth/actions";
import { firebaseAuthProvider } from "./auth/providers/firebase";
import { initConnection } from "./states/connection";
import { setAppReady, setVersion } from "./states/core";
import { showModal } from "./states/modals";
import { isDevEnvironment } from "./utils/env";
import { fetchLatestVersion } from "./utils/version";

/** App startup work that doesn't touch the DOM: starts the config load and
 * auth, then waits for both before the app is ready. Call once, right after
 * render. */
export async function boot(): Promise<void> {
  // before awaiting: PSAs show on the first auth state change
  initConnection();
  Psa.init();
  PwaInstallBanner.init();

  const configLoaded = loadFromLocalStorage();
  void fetchLatestVersion().then((data) => {
    if (data === null) return;
    setVersion(data);
  });

  const authStarted = startAuth(firebaseAuthProvider);
  const accepted = Cookies.getAcceptedCookies();
  if (accepted === null) {
    showModal("Cookies");
  }

  await configLoaded;
  await authStarted;

  if (accepted !== null) {
    Cookies.activateWhatsAccepted();
  }

  MerchBanner.showIfNotClosedBefore();
  PwaInstallBanner.showIfNotClosedBefore();

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
