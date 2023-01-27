import * as UpdateConfig from "../config";
import * as Notifications from "../elements/notifications";
import { isPopupVisible } from "../utils/misc";
import * as Skeleton from "./skeleton";

const wrapperId = "settingsImportWrapper";

export function show(mode: string, config?: string): void {
  Skeleton.append(wrapperId);

  if (!isPopupVisible(wrapperId)) {
    $("#settingsImportWrapper").attr("mode", mode);

    if (mode === "export") {
      $("#settingsImportWrapper .button").addClass("hidden");
      $("#settingsImportWrapper input").val(config ?? "");
    } else if (mode === "import") {
      $("#settingsImportWrapper .button").removeClass("hidden");
    }

    $("#settingsImportWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, 125, () => {
        $("#settingsImportWrapper input").trigger("focus");
        $("#settingsImportWrapper input").trigger("select");
        $("#settingsImportWrapper input").trigger("focus");
      });
  }
}

function hide(): void {
  if (isPopupVisible(wrapperId)) {
    if ($("#settingsImportWrapper input").val() !== "") {
      try {
        UpdateConfig.apply(
          JSON.parse($("#settingsImportWrapper input").val() as string)
        );
      } catch (e) {
        Notifications.add("Failed to import settings: " + e, -1);
      }
      UpdateConfig.saveFullConfigToLocalStorage();
    }
    $("#settingsImportWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate({ opacity: 0 }, 125, () => {
        $("#settingsImportWrapper").addClass("hidden");
        Skeleton.remove(wrapperId);
      });
  }
}

$("#settingsImportWrapper .button").on("click", () => {
  hide();
});

$("#settingsImportWrapper").on("click", (e) => {
  if ($(e.target).attr("id") === "settingsImportWrapper") {
    hide();
  }
});

Skeleton.save(wrapperId);
