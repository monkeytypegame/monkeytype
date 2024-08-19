import Ape from "../ape";
import * as DB from "../db";
import * as Config from "../config";
import * as Loader from "../elements/loader";
import * as Settings from "../pages/settings";
import * as Notifications from "../elements/notifications";
import * as ConnectionState from "../states/connection";
import AnimatedModal from "../utils/animated-modal";
import {
  activeSettingGroupsSchema,
  PresetSettingGroup,
  presetSettingGroupSchema,
} from "@monkeytype/contracts/schemas/presets";
import { getPreset } from "../controllers/preset-controller";

const state = new Map(
  presetSettingGroupSchema.options.map((key) => [key, true])
);

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
        $("#editPresetModal .modal .popupTitle").html("Add new preset");
        $("#editPresetModal .modal submit").html(`add`);
        $("#editPresetModal .modal input").val("");
        $("#editPresetModal .modal input").removeClass("hidden");
        $("#editPresetModal .modal label").addClass("hidden");
        $("#editPresetModal .modal .inputs").removeClass("hidden");
        for (const key of state.keys()) {
          state.set(key, true);
        }
      } else if (action === "edit" && id !== undefined && name !== undefined) {
        for (const key of state.keys()) {
          state.set(key, false);
        }
        const presetSettingGroups = await getPreset(id);
        presetSettingGroups?.config.settingGroups.forEach(
          (currentActiveSettingGroup) =>
            state.set(currentActiveSettingGroup, true)
        );
        //TODO: change settingGroup to activeSettingGroup
        $("#editPresetModal .modal").attr("data-action", "edit");
        $("#editPresetModal .modal").attr("data-preset-id", id);
        $("#editPresetModal .modal .popupTitle").html("Edit preset");
        $("#editPresetModal .modal submit").html(`save`);
        $("#editPresetModal .modal input").val(name);
        $("#editPresetModal .modal input").removeClass("hidden");
        $("#editPresetModal .modal label input").prop("checked", false);
        $("#editPresetModal .modal label").removeClass("hidden");
        $("#editPresetModal .modal .inputs").removeClass("hidden");
      } else if (
        action === "remove" &&
        id !== undefined &&
        name !== undefined
      ) {
        $("#editPresetModal .modal").attr("data-action", "remove");
        $("#editPresetModal .modal").attr("data-preset-id", id);
        $("#editPresetModal .modal .title").html("Delete preset");
        $("#editPresetModal .modal submit").html("delete"); //TODO:fix
        $("#editPresetModal .modal input").addClass("hidden");
        $("#editPresetModal .modal label").addClass("hidden");
        $("#editPresetModal .modal .text").removeClass("hidden");
        $("#editPresetModal .modal .deletePrompt").text(
          // TODO:ask kashish about fix
          `Are you sure you want to delete the preset ${name}?`
        );
        $("#editPresetModal .modal .inputs").addClass("hidden");
      }
      updateUI();
    },
  });
}

function updateUI(): void {
  console.log(state);
  presetSettingGroupSchema.options.forEach(
    (settingGroup: PresetSettingGroup) => {
      $(
        `#editPresetModal .modal .group[data-id="${settingGroup.toString()}"] button`
      ).removeClass("active");
      $(
        `#editPresetModal .modal .group[data-id="${settingGroup.toString()}"] button[value="${state.get(
          settingGroup
        )}"]`
      ).addClass("active");
    }
  );
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

  const snapshotPresets = DB.getSnapshot()?.presets ?? [];

  hide();

  Loader.show();

  if (action === "add") {
    const configChanges = getConfigChanges();
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
    const configChanges = getConfigChanges();
    console.log(configChanges);
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
      preset.config.settingGroups = configChanges.settingGroups;
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

function getSettingGroup(configFieldName: string): PresetSettingGroup {
  switch (configFieldName) {
    case "theme":
    case "themeLight":
    case "themeDark":
    case "autoSwitchTheme":
    case "customTheme":
    case "customThemeColors":
    case "favThemes":
    case "flipTestColors":
    case "colorfulMode":
    case "randomTheme":
    case "customBackground":
    case "customBackgroundSize":
    case "customBackgroundFilter":
      return presetSettingGroupSchema.Enum.theme;

    case "showKeyTips":
    case "capsLockWarning":
    case "showOutOfFocusWarning":
    case "showAverage":
      return presetSettingGroupSchema.Enum["hide elements"];

    case "smoothCaret":
    case "caretStyle":
    case "paceCaretStyle":
    case "paceCaret":
    case "paceCaretCustomSpeed":
    case "repeatedPace":
      return presetSettingGroupSchema.Enum.caret;

    case "quickRestart":
    case "difficulty":
    case "blindMode":
    case "funbox":
    case "alwaysShowWordsHistory":
    case "singleListCommandLine":
    case "minWpm":
    case "minWpmCustomSpeed":
    case "minAcc":
    case "minAccCustom":
    case "repeatQuotes":
    case "customLayoutfluid":
    case "minBurst":
    case "minBurstCustomSpeed":
    case "burstHeatmap": //not sure
    case "britishEnglish":
      return presetSettingGroupSchema.Enum.behaviour;

    case "punctuation":
    case "words":
    case "time":
    case "numbers":
    case "mode":
    case "quoteLength":
    case "language":
      return presetSettingGroupSchema.Enum.test;

    case "fontSize":
    case "timerStyle":
    case "liveSpeedStyle":
    case "liveAccStyle":
    case "liveBurstStyle":
    case "timerColor":
    case "timerOpacity":
    case "showAllLines":
    case "keymapMode":
    case "keymapStyle":
    case "keymapLegendStyle":
    case "keymapLayout":
    case "keymapShowTopRow":
    case "keymapSize":
    case "fontFamily":
    case "smoothLineScroll":
    case "alwaysShowDecimalPlaces":
    case "startGraphsAtZero":
    case "highlightMode":
    case "tapeMode":
    case "typingSpeedUnit":
    case "monkey": //can only be accessed from commandline seems appropriate here
    case "monkeyPowerLevel": //same as monkey
    case "maxLineWidth":
      return presetSettingGroupSchema.Enum.appearance;

    case "freedomMode":
    case "quickEnd":
    case "layout":
    case "confidenceMode":
    case "indicateTypos":
    case "stopOnError":
    case "hideExtraLetters":
    case "strictSpace":
    case "oppositeShiftMode":
    case "lazyMode":
      return presetSettingGroupSchema.Enum.input;

    case "playSoundOnError":
    case "playSoundOnClick":
    case "soundVolume":
      return presetSettingGroupSchema.Enum.sound;

    case "accountChart":
      return presetSettingGroupSchema.Enum.account;

    case "ads":
      return presetSettingGroupSchema.Enum.ads;
    default:
      break;
  }
  throw new Error("Some setting not part of any setting group");
}

function getActiveConfigChanges(): MonkeyTypes.ConfigChanges {
  const presetConfig = Config.getConfigChanges();
  const activeConfigChanges = {} as MonkeyTypes.PresetConfig;
  Object.keys(presetConfig)
    .filter((settingName) => state.get(getSettingGroup(settingName)) === true)
    .forEach((settingName) => {
      //@ts-expect-error this is fine
      activeConfigChanges[settingName] = presetConfig[settingName];
    });
  return activeConfigChanges;
}
function getConfigChanges(): MonkeyTypes.ConfigChanges {
  const activeConfigChanges = getActiveConfigChanges();
  const tags = DB.getSnapshot()?.tags ?? [];

  const activeTagIds: string[] = tags
    .filter((tag: MonkeyTypes.UserTag) => tag.active)
    .map((tag: MonkeyTypes.UserTag) => tag._id);

  console.log("activeConfigChanges", activeConfigChanges);
  return {
    ...activeConfigChanges,
    settingGroups: activeSettingGroupsSchema.parse(
      Array.from(state.entries())
        .filter(([, value]) => value)
        .map(([key]) => key)
    ),
    ...(state.get(presetSettingGroupSchema.Enum.account) === true && {
      tags: activeTagIds,
    }),

    // TODO: Set notifications for no selected
  };
}

async function setup(modalEl: HTMLElement): Promise<void> {
  modalEl.addEventListener("submit", (e) => {
    e.preventDefault();
    void apply();
  });

  presetSettingGroupSchema.options.forEach(
    (settingGroup: PresetSettingGroup) => {
      for (const button of modalEl.querySelectorAll(
        `.group[data-id='${settingGroup.toString()}'] button`
      )) {
        button.addEventListener("click", (e) => {
          state.set(
            settingGroup,
            (e.target as HTMLButtonElement).value === "true" ? true : false
          );
          updateUI();
        });
      }
    }
  );
}
const modal = new AnimatedModal({
  dialogId: "editPresetModal",
  setup,
});
