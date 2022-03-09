import Ape from "../ape";
import * as DB from "../db";
import * as Config from "../config";
import * as Loader from "../elements/loader";
import * as Settings from "../pages/settings";
import * as Notifications from "../elements/notifications";

export function show(action: string, id?: string, name?: string): void {
  if (action === "add") {
    $("#presetWrapper #presetEdit").attr("action", "add");
    $("#presetWrapper #presetEdit .title").html("Create new preset");
    $("#presetWrapper #presetEdit .button").html(`<i class="fas fa-plus"></i>`);
    $("#presetWrapper #presetEdit input.text").val("");
    $("#presetWrapper #presetEdit input.text").removeClass("hidden");
    $("#presetWrapper #presetEdit label").addClass("hidden");
  } else if (action === "edit" && id && name) {
    $("#presetWrapper #presetEdit").attr("action", "edit");
    $("#presetWrapper #presetEdit").attr("presetid", id);
    $("#presetWrapper #presetEdit .title").html("Edit preset");
    $("#presetWrapper #presetEdit .button").html(`<i class="fas fa-pen"></i>`);
    $("#presetWrapper #presetEdit input.text").val(name);
    $("#presetWrapper #presetEdit input.text").removeClass("hidden");
    $("#presetWrapper #presetEdit label input").prop("checked", false);
    $("#presetWrapper #presetEdit label").removeClass("hidden");
  } else if (action === "remove" && id) {
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
        $("#presetWrapper #presetEdit input").trigger("focus");
      });
  }
}

function hide(): void {
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

async function apply(): Promise<void> {
  const action = $("#presetWrapper #presetEdit").attr("action");
  const presetName = $("#presetWrapper #presetEdit input").val() as string;
  const presetId = $("#presetWrapper #presetEdit").attr("presetId") as string;

  const updateConfig: boolean = $(
    "#presetWrapper #presetEdit label input"
  ).prop("checked");

  let configChanges: MonkeyTypes.ConfigChanges = {};

  if ((updateConfig && action === "edit") || action === "add") {
    configChanges = Config.getConfigChanges();

    const tags = DB.getSnapshot().tags || [];

    const activeTagIds: string[] = tags
      .filter((tag: MonkeyTypes.Tag) => tag.active)
      .map((tag: MonkeyTypes.Tag) => tag._id);
    configChanges.tags = activeTagIds;
  }

  const snapshotPresets = DB.getSnapshot().presets || [];

  hide();

  Loader.show();

  if (action === "add") {
    const response = await Ape.presets.add(presetName, configChanges);

    if (response.status !== 200) {
      Notifications.add("Failed to add preset: " + response.message, -1);
    } else {
      Notifications.add("Preset added", 1, 2);
      snapshotPresets.push({
        name: presetName,
        config: configChanges,
        _id: response.data.presetId,
      });
    }
  } else if (action === "edit") {
    const response = await Ape.presets.edit(
      presetId,
      presetName,
      configChanges
    );

    if (response.status !== 200) {
      Notifications.add("Failed to edit preset: " + response.message, -1);
    } else {
      Notifications.add("Preset updated", 1);
      const preset: MonkeyTypes.Preset = snapshotPresets.filter(
        (preset: MonkeyTypes.Preset) => preset._id === presetId
      )[0];
      preset.name = presetName;
      if (updateConfig) {
        preset.config = configChanges;
      }
    }
  } else if (action === "remove") {
    const response = await Ape.presets.delete(presetId);

    if (response.status !== 200) {
      Notifications.add("Failed to remove preset: " + response.message, -1);
    } else {
      Notifications.add("Preset removed", 1);
      snapshotPresets.forEach((preset: MonkeyTypes.Preset, index: number) => {
        if (preset._id === presetId) {
          snapshotPresets.splice(index, 1);
        }
      });
    }
  }

  Settings.update();
  Loader.hide();
}

$("#presetWrapper").on("click", (e) => {
  if ($(e.target).attr("id") === "presetWrapper") {
    hide();
  }
});

$("#presetWrapper #presetEdit .button").on("click", () => {
  apply();
});

$("#presetWrapper #presetEdit input").on("keypress", (e) => {
  if (e.key === "Enter") {
    apply();
  }
});

$(document).on(
  "click",
  ".pageSettings .section.presets .addPresetButton",
  () => {
    show("add");
  }
);

$(document).on("click", ".pageSettings .section.presets .editButton", (e) => {
  const presetid = $(e.currentTarget).parent(".preset").attr("id");
  const name = $(e.currentTarget).siblings(".button").children(".title").text();
  show("edit", presetid, name);
});

$(document).on("click", ".pageSettings .section.presets .removeButton", (e) => {
  const presetid = $(e.currentTarget).parent(".preset").attr("id");
  const name = $(e.currentTarget).siblings(".button").children(".title").text();
  show("remove", presetid, name);
});
