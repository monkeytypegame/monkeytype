import * as ThemeController from "../controllers/theme-controller";
import Config from "../config";
import * as Notifications from "../elements/notifications";
import * as CustomThemePopup from "./custom-theme-popup";
import * as Skeleton from "./skeleton";
import { isPopupVisible } from "../utils/misc";

const wrapperId = "shareCustomThemeWrapper";

export function show(): void {
  Skeleton.append(wrapperId);

  if (!isPopupVisible(wrapperId)) {
    $(`#${wrapperId}`)
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, 125, () => {
        $(`#${wrapperId} #shareCustomThemeEdit .url`).trigger("focus");
      });
  }
}

function hide(): void {
  if (isPopupVisible(wrapperId)) {
    $(`#${wrapperId}`)
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        125,
        () => {
          $(`#${wrapperId}`).addClass("hidden");
          Skeleton.remove(wrapperId);
        }
      );
  }
}

async function generateUrl(): Promise<string> {
  const newTheme: {
    c: (string | undefined)[];
    bgi?: string;
    bgp?: string;
    bgf?: object;
  } = {
    c: ThemeController.colorVars.map((color) =>
      $(
        `.pageSettings .customTheme .customThemeEdit #${color}[type='color']`
      ).attr("value")
    ),
  };

  if (
    $("#shareCustomThemeWrapper #shareCustomThemeEdit #includeBackground").is(
      ":checked"
    )
  ) {
    newTheme.bgi = await Config.customBackground;
    newTheme.bgp = await Config.customBackgroundSize;
    newTheme.bgf = await Config.customBackgroundFilter;
  }

  return "https://monkeytype.com?customTheme=" + btoa(JSON.stringify(newTheme));
}

$("#shareCustomThemeWrapper").on("click", (e) => {
  if ($(e.target).attr("id") === "shareCustomThemeWrapper") {
    hide();
  }
});

$("#shareCustomThemeWrapper #shareCustomThemeEdit .copy-button").on(
  "click",
  async () => {
    const url = await generateUrl();

    navigator.clipboard.writeText(url).then(
      function () {
        Notifications.add("URL Copied to clipboard", 0);
        hide();
      },
      function () {
        Notifications.add("Could not copy text", 0);
        hide();
        CustomThemePopup.show(url);
      }
    );
  }
);

$("#shareCustomThemeButton").on("click", () => {
  show();
});

$(document).on("keypress", function (e) {
  if (e.key === "Enter" && isPopupVisible(wrapperId)) {
    $("#shareCustomThemeWrapper #shareCustomThemeEdit .copy-button").trigger(
      "click"
    );
  }
});

Skeleton.save(wrapperId);
