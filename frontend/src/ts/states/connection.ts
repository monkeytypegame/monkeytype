import { createSignal } from "solid-js";
import { debounce } from "throttle-debounce";
import { showSuccessNotification } from "./notifications";
import { connectionEvent } from "../events/connection";
import { onDOMReady } from "../utils/dom";
import { addBanner, removeBanner } from "./banners";
import { isTestActive } from "./test";

const [isOnline, setOnline] = createSignal(navigator.onLine);
export { isOnline };

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
  if (isOnline()) {
    if (noInternetBannerId !== undefined) {
      showSuccessNotification("You're back online", {
        customTitle: "Connection",
      });
      removeBanner(noInternetBannerId);
      noInternetBannerId = undefined;
    }
    bannerAlreadyClosed = false;
  } else if (!isTestActive()) {
    showOfflineBanner();
  }
});

connectionEvent.subscribe((newState) => {
  setOnline(newState);
  throttledHandleState();
});

onDOMReady(() => {
  setOnline(navigator.onLine);
  if (!isOnline()) {
    showOfflineBanner();
  }
});
