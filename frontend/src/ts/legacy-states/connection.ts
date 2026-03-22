import { debounce } from "throttle-debounce";
import { showSuccessNotification } from "../states/notifications";
import { connectionEvent } from "../events/connection";
import * as TestState from "../test/test-state";
import { onDOMReady } from "../utils/dom";
import { addBanner, removeBanner } from "../states/banners";

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
      showSuccessNotification("You're back online", {
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

connectionEvent.subscribe((newState) => {
  state = newState;
  throttledHandleState();
});

onDOMReady(() => {
  state = navigator.onLine;
  if (!state) {
    showOfflineBanner();
  }
});
