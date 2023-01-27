import { isPopupVisible } from "../utils/misc";
import * as Skeleton from "./skeleton";

const wrapperId = "customThemeShareWrapper";

export function show(value: string): void {
  Skeleton.append(wrapperId);
  if (!isPopupVisible(wrapperId)) {
    // let save = [];
    // $.each(
    //   $(".pageSettings .section.customTheme [type='color']"),
    //   (index, element) => {
    //     save.push($(element).attr("value"));
    //   }
    // );
    // $("#customThemeShareWrapper input").val(JSON.stringify(save));
    $("#customThemeShareWrapper input").val(value);
    $("#customThemeShareWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, 125, () => {
        $("#customThemeShare input").trigger("focus");
        $("#customThemeShare input").trigger("select");
        $("#customThemeShare input").trigger("focus");
      });
  }
}

function hide(): void {
  if (isPopupVisible(wrapperId)) {
    // try {
    //   UpdateConfig.setCustomThemeColors(
    //     JSON.parse($("#customThemeShareWrapper input").val())
    //   );
    // } catch (e) {
    //   Notifications.add(
    //     "Something went wrong. Reverting to default custom colors.",
    //     0,
    //     4
    //   );
    //   UpdateConfig.setCustomThemeColors(Config.defaultConfig.customThemeColors);
    // }
    // ThemePicker.setCustomInputs();
    $("#customThemeShareWrapper input").val("");
    $("#customThemeShareWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        125,
        () => {
          $("#customThemeShareWrapper").addClass("hidden");
          Skeleton.remove(wrapperId);
        }
      );
  }
}

$("#customThemeShareWrapper").on("click", (e) => {
  if ($(e.target).attr("id") === "customThemeShareWrapper") {
    hide();
  }
});

$("#customThemeShare .button").on("click", () => {
  hide();
});

Skeleton.save(wrapperId);
