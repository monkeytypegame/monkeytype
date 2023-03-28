import * as Notifications from "../elements/notifications";
import * as ConnectionEvent from "../observables/connection-event";

let state = navigator.onLine;

export function get(): boolean {
  return state;
}

let noInternetBannerId: number | undefined = undefined;

function showBanner(): void {
  if (noInternetBannerId == undefined) {
    noInternetBannerId = Notifications.addBanner(
      "No internet connection",
      0,
      "exclamation-triangle",
      false
    );
  }
}

ConnectionEvent.subscribe((newState) => {
  state = newState;
  if (state) {
    Notifications.add("You're back online", 1, {
      customTitle: "Connection",
    });
    if (noInternetBannerId != undefined) {
      $(
        `#bannerCenter .banner[id="${noInternetBannerId}"] .closeButton`
      ).trigger("click");
      noInternetBannerId = undefined;
    }
  } else {
    showBanner();
  }
});

window.addEventListener("load", () => {
  state = navigator.onLine;
  if (!state) {
    showBanner();
  }
});
