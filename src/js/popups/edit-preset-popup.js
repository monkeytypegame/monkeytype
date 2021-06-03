import * as Loader from "./loader";
import * as DB from "./db";
import * as CloudFunctions from "./cloud-functions";
import * as Notifications from "./notifications";
import * as Settings from "./settings";
import * as Config from "./config";
import axiosInstance from "./axios-instance";

export function show(action, id, name) {
  if (action === "add") {
    $("#presetWrapper #presetEdit").attr("action", "add");
    $("#presetWrapper #presetEdit .title").html("Create new preset");
    $("#presetWrapper #presetEdit .button").html(`<i class="fas fa-plus"></i>`);
    $("#presetWrapper #presetEdit input.text").val("");
    $("#presetWrapper #presetEdit input.text").removeClass("hidden");
    $("#presetWrapper #presetEdit label").addClass("hidden");
  } else if (action === "edit") {
    $("#presetWrapper #presetEdit").attr("action", "edit");
    $("#presetWrapper #presetEdit").attr("presetid", id);
    $("#presetWrapper #presetEdit .title").html("Edit preset");
    $("#presetWrapper #presetEdit .button").html(`<i class="fas fa-pen"></i>`);
    $("#presetWrapper #presetEdit input.text").val(name);
    $("#presetWrapper #presetEdit input.text").removeClass("hidden");
    $("#presetWrapper #presetEdit label input").prop("checked", false);
    $("#presetWrapper #presetEdit label").removeClass("hidden");
  } else if (action === "remove") {
    $("#presetWrapper #presetEdit").attr("action", "remove");
    $("#presetWrapper #presetEdit").attr("presetid", id);
    $("#presetWrapper #presetEdit .title").html("Remove preset " + name);
    $("#presetWrapper #presetEdit .button").html(
      `<i class="fas fa-check"></i>`
    );
    $("#presetWrapper #presetEdit input.text").addClass("hidden");
    $("#presetWrapper #presetEdit label").addClass("hidden");
  }

  if ($("#presetWrapper").hasClass("hidden")) {
    $("#presetWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, 100, () => {
        $("#presetWrapper #presetEdit input").focus();
      });
  }
}

function hide() {
  if (!$("#presetWrapper").hasClass("hidden")) {
    $("#presetWrapper #presetEdit").attr("action", "");
    $("#presetWrapper #presetEdit").attr("tagid", "");
    $("#presetWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        100,
        () => {
          $("#presetWrapper").addClass("hidden");
        }
      );
  }
}

function apply() {
  let action = $("#presetWrapper #presetEdit").attr("action");
  let inputVal = $("#presetWrapper #presetEdit input").val();
  let presetid = $("#presetWrapper #presetEdit").attr("presetid");
  let configChanges = Config.getConfigChanges();
  hide();
  if (action === "add") {
    Loader.show();
    axiosInstance
      .post("/addPreset", {
        obj: {
          name: inputVal,
          config: configChanges,
        },
      })
      .then((e) => {
        console.log(e);
        console.log("Should be ready to go away");
        Loader.hide();
        let status = e.data.resultCode;
        if (status === 1) {
          Notifications.add("Preset added", 1, 2);
          DB.getSnapshot().presets.push({
            name: inputVal,
            config: configChanges,
            _id: e.data.id,
          });
          Settings.update();
        } else if (status === -1) {
          Notifications.add("Invalid preset name", 0);
        } else if (status === -2) {
          Notifications.add("You can't add any more presets", 0);
        } else if (status < -1) {
          Notifications.add("Unknown error: " + e.data.message, -1);
        }
      });
  } else if (action === "edit") {
    Loader.show();
    axiosInstance
      .post("/editPreset", {
        presetName: inputVal,
        presetid: presetid,
        config: configChanges,
      })
      .then((e) => {
        Loader.hide();
        let status = e.data.resultCode;
        if (status === 1) {
          Notifications.add("Preset updated", 1);
          let preset = DB.getSnapshot().presets.filter(
            (preset) => preset._id == presetid
          )[0];
          preset.name = inputVal;
          preset.config = configChanges;
          Settings.update();
        } else if (status === -1) {
          Notifications.add("Invalid preset name", 0);
        } else if (status < -1) {
          Notifications.add("Unknown error: " + e.data.message, -1);
        }
      });
  } else if (action === "remove") {
    Loader.show();
    axiosInstance
      .post("/removePreset", {
        presetid,
      })
      .then((e) => {
        Loader.hide();
        let status = e.data.resultCode;
        if (status === 1) {
          Notifications.add("Preset removed", 1);
          DB.getSnapshot().presets.forEach((preset, index) => {
            if (preset._id === presetid) {
              DB.getSnapshot().presets.splice(index, 1);
            }
          });
          Settings.update();
        } else if (status < -1) {
          Notifications.add("Unknown error: " + e.data.message, -1);
        }
      });
  }
}

$("#presetWrapper").click((e) => {
  if ($(e.target).attr("id") === "presetWrapper") {
    hide();
  }
});

$("#presetWrapper #presetEdit .button").click(() => {
  apply();
});

$("#presetWrapper #presetEdit input").keypress((e) => {
  if (e.keyCode == 13) {
    apply();
  }
});
