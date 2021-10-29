import * as UpdateConfig from "./config";
import * as Settings from "./settings";
import * as Notifications from "./notifications";

export function show(mode, config) {
  if ($("#settingsImportWrapper").hasClass("hidden")) {
    $("#settingsImportWrapper").attr("mode", mode);

    if (mode === "export") {
      $("#settingsImportWrapper .button").addClass("hidden");
      $("#settingsImportWrapper input").val(config);
    } else if (mode === "import") {
      $("#settingsImportWrapper .button").removeClass("hidden");
    }

    $("#settingsImportWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, 100, (e) => {
        $("#settingsImportWrapper input").focus();
        $("#settingsImportWrapper input").select();
        $("#settingsImportWrapper input").focus();
      });
  }
}

function hide() {
  if (!$("#settingsImportWrapper").hasClass("hidden")) {
    if ($("#settingsImportWrapper input").val() !== "") {
      try {
        UpdateConfig.apply(JSON.parse($("#settingsImportWrapper input").val()));
      } catch (e) {
        Notifications.add(
          "An error occured while importing settings: " + e,
          -1
        );
      }
      UpdateConfig.saveToLocalStorage();
      Settings.update();
    }
    $("#settingsImportWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate({ opacity: 0 }, 100, (e) => {
        $("#settingsImportWrapper").addClass("hidden");
      });
  }
}

$("#settingsImport .button").click((e) => {
  hide();
});

$("#settingsImportWrapper").click((e) => {
  if ($(e.target).attr("id") === "settingsImportWrapper") {
    hide();
  }
});
