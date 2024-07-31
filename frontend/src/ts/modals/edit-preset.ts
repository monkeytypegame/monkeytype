import Ape from "../ape";
import * as DB from "../db";
import * as Config from "../config";
import * as Loader from "../elements/loader";
import * as Settings from "../pages/settings";
import * as Notifications from "../elements/notifications";
import * as ConnectionState from "../states/connection";
import AnimatedModal from "../utils/animated-modal";

export function show(action: string, id?: string, name?: string): void {
  if (!ConnectionState.get()) {
    Notifications.add("You are offline", 0, {
      duration: 2,
    });
    return;
  }

  void modal.show({
    focusFirstInput: true,
    beforeAnimation: async () => {
      $("#editPresetModal .modal .text").addClass("hidden");
      if (action === "add") {
        $("#editPresetModal .modal").attr("data-action", "add");
        $("#editPresetModal .modal .title").html("Add new preset");
        $("#editPresetModal .modal button").html(`add`);
        $("#editPresetModal .modal input").val("");
        $("#editPresetModal .modal input").removeClass("hidden");
        $("#editPresetModal .modal label").addClass("hidden");
      } else if (action === "edit" && id !== undefined && name !== undefined) {
        $("#editPresetModal .modal").attr("data-action", "edit");
        $("#editPresetModal .modal").attr("data-preset-id", id);
        $("#editPresetModal .modal .title").html("Edit preset");
        $("#editPresetModal .modal button").html(`save`);
        $("#editPresetModal .modal input").val(name);
        $("#editPresetModal .modal input").removeClass("hidden");
        $("#editPresetModal .modal label input").prop("checked", false);
        $("#editPresetModal .modal label").removeClass("hidden");
      } else if (
        action === "remove" &&
        id !== undefined &&
        name !== undefined
      ) {
        $("#editPresetModal .modal").attr("data-action", "remove");
        $("#editPresetModal .modal").attr("data-preset-id", id);
        $("#editPresetModal .modal .title").html("Delete preset");
        $("#editPresetModal .modal button").html("delete");
        $("#editPresetModal .modal input").addClass("hidden");
        $("#editPresetModal .modal label").addClass("hidden");
        $("#editPresetModal .modal .text").removeClass("hidden");
        $("#editPresetModal .modal .text").text(
          `Are you sure you want to delete the preset ${name}?`
        );
      }
    },
  });
}

function hide(): void {
  void modal.hide();
}

async function apply(): Promise<void> {
  const action = $("#editPresetModal .modal").attr("data-action");
  const propPresetName = $("#editPresetModal .modal input").val() as string;
  const presetName = propPresetName.replaceAll(" ", "_");
  const presetId = $("#editPresetModal .modal").attr(
    "data-preset-id"
  ) as string;

  const updateConfig: boolean = $("#editPresetModal .modal label input").prop(
    "checked"
  );

  let configChanges: MonkeyTypes.ConfigChanges = {};

  if ((updateConfig && action === "edit") || action === "add") {
    configChanges = Config.getConfigChanges();

    const tags = DB.getSnapshot()?.tags ?? [];

    const activeTagIds: string[] = tags
      .filter((tag: MonkeyTypes.UserTag) => tag.active)
      .map((tag: MonkeyTypes.UserTag) => tag._id);
    configChanges.tags = activeTagIds;
  }

  const snapshotPresets = DB.getSnapshot()?.presets ?? [];

  hide();

  Loader.show();

  if (action === "add") {
    const response = await Ape.presets.add({
      body: { name: presetName, config: configChanges },
    });

    if (response.status !== 200 || response.body.data === null) {
      Notifications.add(
        "Failed to add preset: " +
          response.body.message.replace(presetName, propPresetName),
        -1
      );
    } else {
      Notifications.add("Preset added", 1, {
        duration: 2,
      });
      snapshotPresets.push({
        name: presetName,
        config: configChanges,
        display: propPresetName,
        _id: response.body.data.presetId,
      } as MonkeyTypes.SnapshotPreset);
    }
  } else if (action === "edit") {
    const response = await Ape.presets.save({
      body: {
        _id: presetId,
        name: presetName,
        config: configChanges,
      },
    });

    if (response.status !== 200) {
      Notifications.add("Failed to edit preset: " + response.body.message, -1);
    } else {
      Notifications.add("Preset updated", 1);
      const preset = snapshotPresets.filter(
        (preset: MonkeyTypes.SnapshotPreset) => preset._id === presetId
      )[0] as MonkeyTypes.SnapshotPreset;
      preset.name = presetName;
      preset.display = presetName.replace(/_/g, " ");
      if (updateConfig) {
        preset.config = configChanges;
      }
    }
  } else if (action === "remove") {
    const response = await Ape.presets.delete({ params: { presetId } });

    if (response.status !== 200) {
      Notifications.add(
        "Failed to remove preset: " + response.body.message,
        -1
      );
    } else {
      Notifications.add("Preset removed", 1);
      snapshotPresets.forEach(
        (preset: MonkeyTypes.SnapshotPreset, index: number) => {
          if (preset._id === presetId) {
            snapshotPresets.splice(index, 1);
          }
        }
      );
    }
  }

  void Settings.update();
  Loader.hide();
}

const modal = new AnimatedModal({
  dialogId: "editPresetModal",
  setup: async (modalEl): Promise<void> => {
    modalEl.addEventListener("submit", (e) => {
      e.preventDefault();
      void apply();
    });
  },
});
