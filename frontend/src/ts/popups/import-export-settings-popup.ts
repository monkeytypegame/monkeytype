import * as UpdateConfig from "../config";
import * as Notifications from "../elements/notifications";

export function show(mode: string, config?: string): void {
  if ($("#settingsImportWrapper").hasClass("hidden")) {
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
      .animate({ opacity: 1 }, 100, () => {
        $("#settingsImportWrapper input").trigger("focus");
        $("#settingsImportWrapper input").select();
        $("#settingsImportWrapper input").trigger("focus");
      });
  }
}

function hide(): void {
  if (!$("#settingsImportWrapper").hasClass("hidden")) {
    if ($("#settingsImportWrapper input").val() !== "") {
      try {
        UpdateConfig.apply(
          JSON.parse($("#settingsImportWrapper input").val() as string)
        );
      } catch (e) {
        Notifications.add(
          "An error occured while importing settings: " + e,
          -1
        );
      }
      UpdateConfig.saveFullConfigToLocalStorage();
    }
    $("#settingsImportWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate({ opacity: 0 }, 100, () => {
        $("#settingsImportWrapper").addClass("hidden");
      });
  }
}

$("#settingsImport .button").on("click", () => {
  hide();
});

$("#settingsImportWrapper").on("click", (e) => {
  if ($(e.target).attr("id") === "settingsImportWrapper") {
    hide();
  }
});
