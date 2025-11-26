/* oxlint-disable no-unsafe-call */
/* oxlint-disable no-unsafe-member-access */
import * as Notifications from "../elements/notifications";
import * as AdController from "../controllers/ad-controller";
import * as Skeleton from "../utils/skeleton";
import { isPopupVisible } from "../utils/misc";
import { animate } from "animejs";

const wrapperId = "videoAdPopupWrapper";

export async function show(): Promise<void> {
  Skeleton.append(wrapperId, "popups");
  await AdController.checkAdblock();
  if (AdController.adBlock) {
    Notifications.add(
      "Looks like you're using an adblocker. Video ads will not work until you disable it.",
      0,
      {
        duration: 6,
      }
    );
    return;
  }

  await AdController.checkCookieblocker();
  if (AdController.cookieBlocker) {
    Notifications.add(
      "Looks like you're using a cookie popup blocker. Video ads will not work without giving your consent through the popup.",
      0,
      {
        duration: 7,
      }
    );
    return;
  }

  if (!isPopupVisible(wrapperId)) {
    const el = document.querySelector("#videoAdPopupWrapper") as HTMLElement;

    animate(el, {
      opacity: [0, 1],
      duration: 125,
      onBegin: () => {
        el.classList.remove("hidden");
      },
      onComplete: () => {
        //@ts-expect-error 3rd party ad code
        window.dataLayer.push({ event: "EG_Video" });
      },
    });
  }
}

function hide(): void {
  if (isPopupVisible(wrapperId)) {
    const el = document.querySelector("#videoAdPopupWrapper") as HTMLElement;
    animate(el, {
      opacity: [1, 0],
      duration: 125,
      onComplete: () => {
        el.classList.add("hidden");
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
    Notifications.add("Failed to load video ad. Please try again later", -1, {
      duration: 3,
    });
    hide();
  }
}

$(".pageTest #watchVideoAdButton").on("click", () => {
  void show();
});

Skeleton.save(wrapperId);
