import { debounce } from "throttle-debounce";
import * as Notifications from "../elements/notifications";
import * as ConnectionEvent from "../observables/connection-event";
import * as TestState from "../test/test-state";

let state = navigator.onLine;

export function get(): boolean {
  return state;
}

let noInternetBannerId: number | undefined = undefined;

let bannerAlreadyClosed = false;

export function showOfflineBanner(): void {
  if (bannerAlreadyClosed) return;
  if (noInternetBannerId === undefined) {
    noInternetBannerId = Notifications.addPSA(
      "No internet connection",
      0,
      "exclamation-triangle",
      false,
      () => {
        bannerAlreadyClosed = true;
        noInternetBannerId = undefined;
      }
    );
  }
}

const throttledHandleState = debounce(5000, () => {
  if (state) {
    if (noInternetBannerId !== undefined) {
      Notifications.add("You're back online", 1, {
        customTitle: "Connection",
      });
      $(
        `#bannerCenter .banner[id="${noInternetBannerId}"] .closeButton`
      ).trigger("click");
    }
    bannerAlreadyClosed = false;
  } else if (!TestState.isActive) {
    showOfflineBanner();
  }
});

ConnectionEvent.subscribe((newState) => {
  state = newState;
  throttledHandleState();
});

window.addEventListener("load", () => {
  state = navigator.onLine;
  if (!state) {
    showOfflineBanner();
  }
});
