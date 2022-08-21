import * as Notifications from "../elements/notifications";
import * as AdController from "../controllers/ad-controller";

export async function show(): Promise<void> {
  await AdController.checkAdblock();
  if (AdController.adBlock) {
    Notifications.add(
      "Looks like you're using an adblocker. Video ads will not work until you disable it.",
      0,
      6
    );
    return;
  }

  await AdController.checkCookieblocker();
  if (AdController.cookieBlocker) {
    Notifications.add(
      "Looks like you're using a cookie popup blocker. Video ads will not work without giving your consent through the popup.",
      0,
      7
    );
    return;
  }

  if ($("#videoAdPopupWrapper").hasClass("hidden")) {
    $("#videoAdPopupWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, 100, () => {
        //@ts-ignore
        window.dataLayer.push({ event: "EG_Video" });
      });
  }
}

function hide(): void {
  if (!$("#videoAdPopupWrapper").hasClass("hidden")) {
    $("#videoAdPopupWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        100,
        () => {
          $("#videoAdPopupWrapper").addClass("hidden");
        }
      );
  }
}

export function egVideoListener(options: Record<string, string>): void {
  const event = options["event"];

  if (event === "started") {
    //
  } else if (event === "finished") {
    hide();
  } else if (event === "empty") {
    Notifications.add("Failed to load video ad. Please try again later", -1, 3);
    hide();
  }
}

$(".pageTest #watchVideoAdButton").on("click", () => {
  show();
});
