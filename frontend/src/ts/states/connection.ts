import { debounce } from "throttle-debounce";
import * as Notifications from "../elements/notifications";
import * as ConnectionEvent from "../observables/connection-event";
import * as TestState from "../test/test-state";
import { qs, onDOMReady } from "../utils/dom";

let state = navigator.onLine;

export function get(): boolean {
  return state;
}

let noInternetBannerId: number | undefined = undefined;

let bannerAlreadyClosed = false;

export function showOfflineBanner(): void {
  if (bannerAlreadyClosed) return;
  noInternetBannerId ??= Notifications.addPSA(
    "No internet connection",
    0,
    "exclamation-triangle",
    false,
    () => {
      bannerAlreadyClosed = true;
      noInternetBannerId = undefined;
    },
  );
}

const throttledHandleState = debounce(5000, () => {
  if (state) {
    if (noInternetBannerId !== undefined) {
      Notifications.add("You're back online", 1, {
        customTitle: "Connection",
      });
      qs(
        `#bannerCenter .psa.notice[id="${noInternetBannerId}"] .closeButton`,
      )?.dispatch("click");
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
  console.warn("SECOND_LOAD");
});

onDOMReady(() => {
  console.warn("DOM");
  state = navigator.onLine;
  if (!state) {
    showOfflineBanner();
  }
});

document.addEventListener("DOMContentLoaded", () => {
  console.warn("FIRST_DOM");
});
