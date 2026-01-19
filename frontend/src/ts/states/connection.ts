import { debounce } from "throttle-debounce";
import * as Notifications from "../elements/notifications";
import * as ConnectionEvent from "../observables/connection-event";
import * as TestState from "../test/test-state";
import { onDOMReady } from "../utils/dom";
import { addBanner, removeBanner } from "../stores/banners";

let state = navigator.onLine;

export function get(): boolean {
  return state;
}

let noInternetBannerId: number | undefined = undefined;

let bannerAlreadyClosed = false;

export function showOfflineBanner(): void {
  if (bannerAlreadyClosed) return;
  noInternetBannerId ??= addBanner({
    level: "notice",
    text: "No internet connection",
    icon: "fas fa-exclamation-triangle",
    onClose: () => {
      bannerAlreadyClosed = true;
      noInternetBannerId = undefined;
    },
  });
}

const throttledHandleState = debounce(5000, () => {
  if (state) {
    if (noInternetBannerId !== undefined) {
      Notifications.add("You're back online", 1, {
        customTitle: "Connection",
      });
      removeBanner(noInternetBannerId);
      noInternetBannerId = undefined;
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
