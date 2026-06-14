import {
  showNoticeNotification,
  showErrorNotification,
} from "../states/notifications";
import * as AdController from "../controllers/ad-controller";
import * as Skeleton from "../utils/skeleton";
import { isPopupVisible } from "../utils/misc";
import { onDOMReady, qs } from "../utils/dom";

const wrapperId = "videoAdPopupWrapper";

export async function show(): Promise<void> {
  Skeleton.append(wrapperId, "popups");
  await AdController.checkAdblock();
  if (AdController.adBlock) {
    showNoticeNotification(
      "Looks like you're using an adblocker. Video ads will not work until you disable it.",
      {
        durationMs: 6000,
      },
    );
    return;
  }

  await AdController.checkCookieblocker();
  if (AdController.cookieBlocker) {
    showNoticeNotification(
      "Looks like you're using a cookie popup blocker. Video ads will not work without giving your consent through the popup.",
      {
        durationMs: 7000,
      },
    );
    return;
  }

  if (!isPopupVisible(wrapperId)) {
    const el = qs("#videoAdPopupWrapper");

    el?.animate({
      opacity: [0, 1],
      duration: 125,
      onBegin: () => {
        el.show();
      },
      onComplete: () => {
        // @ts-expect-error 3rd party ad code
        // oxlint-disable-next-line no-unsafe-call no-unsafe-member-access
        window.dataLayer.push({ event: "EG_Video" });
      },
    });
  }
}

function hide(): void {
  if (isPopupVisible(wrapperId)) {
    const el = qs("#videoAdPopupWrapper");

    el?.animate({
      opacity: [1, 0],
      duration: 125,
      onComplete: () => {
        el.hide();
        Skeleton.remove(wrapperId);
      },
    });
  }
}

export function egVideoListener(options: Record<string, string>): void {
  const event = options["event"];

  if (event === "started") {
    //
  } else if (event === "finished") {
    hide();
  } else if (event === "empty") {
    showErrorNotification("Failed to load video ad. Please try again later", {
      durationMs: 3000,
    });
    hide();
  }
}

qs(".pageTest #watchVideoAdButton")?.on("click", () => {
  void show();
});

onDOMReady(() => {
  Skeleton.save(wrapperId);
});
