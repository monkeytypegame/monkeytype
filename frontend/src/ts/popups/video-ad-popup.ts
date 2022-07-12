import * as Notifications from "../elements/notifications";

function show(): void {
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
    Notifications.add("Failed to load video ad. Please try again later", 0, 3);
    hide();
  }
}

$(".pageTest #watchVideoAdButton").on("click", () => {
  show();
});
