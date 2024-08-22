import Ape from "../ape";
import * as DB from "../db";
import * as Config from "../config";
import * as Loader from "../elements/loader";
import * as Settings from "../pages/settings";
import * as Notifications from "../elements/notifications";
import * as ConnectionState from "../states/connection";
import AnimatedModal from "../utils/animated-modal";
import {
  ActiveSettingGroupsSchema,
  PresetSettingGroup,
  PresetSettingGroupSchema,
  PresetType,
  PresetTypeSchema,
} from "@monkeytype/contracts/schemas/presets";
import { getPreset } from "../controllers/preset-controller";
import defaultConfig from "../constants/default-config";

const state = {
  presetType: "full" as PresetType,
  checkboxes: new Map(
    PresetSettingGroupSchema.options.map((key: PresetSettingGroup) => [
      key,
      true,
    ])
  ),
};

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
        $("#editPresetModal .modal .submit").html(`add`);
        $("#editPresetModal .modal input").val("");
        $("#editPresetModal .modal input").removeClass("hidden");
        $("#editPresetModal .modal label").addClass("hidden");
        $("#editPresetModal .modal .inputs").removeClass("hidden");
        $("#editPresetModal .modal .presetType").removeClass("hidden");
        state.presetType = "full";
        addCheckBoxes();
        addPresetTypeEventListeners();
      } else if (action === "edit" && id !== undefined && name !== undefined) {
        $("#editPresetModal .modal").attr("data-action", "edit");
        $("#editPresetModal .modal").attr("data-preset-id", id);
        $("#editPresetModal .modal .popupTitle").html("Edit preset");
        $("#editPresetModal .modal .submit").html(`save`);
        $("#editPresetModal .modal input").val(name);
        $("#editPresetModal .modal input").removeClass("hidden");
        $("#editPresetModal .modal label input").prop("checked", false);
        $("#editPresetModal .modal label").removeClass("hidden");
        $("#editPresetModal .modal .inputs").removeClass("hidden");
        $("#editPresetModal .modal .presetType").removeClass("hidden");
        addCheckBoxes();
        await initializeEditState(id);
        addPresetTypeEventListeners();
      } else if (
        action === "remove" &&
        id !== undefined &&
        name !== undefined
      ) {
        $("#editPresetModal .modal").attr("data-action", "remove");
        $("#editPresetModal .modal").attr("data-preset-id", id);
        $("#editPresetModal .modal .popupTitle").html("Delete preset");
        $("#editPresetModal .modal .submit").html("delete");
        $("#editPresetModal .modal input").addClass("hidden");
        $("#editPresetModal .modal label").addClass("hidden");
        $("#editPresetModal .modal .text").removeClass("hidden");
        $("#editPresetModal .modal .deletePrompt").text(
          `Are you sure you want to delete the preset ${name}?`
        );
        $("#editPresetModal .modal .inputs").addClass("hidden");
        $("#editPresetModal .modal .presetType").addClass("hidden");
      }
      updateUI();
    },
  });
}

function addPresetTypeEventListeners(): void {
  PresetTypeSchema.options.forEach((presetType) => {
    $(`#editPresetModal .modal .presetType button[value="${presetType}"]`).on(
      "click",
      () => {
        state.presetType = presetType;
        updateUI();
      }
    );
  });
}

async function initializeEditState(id: string): Promise<void> {
  for (const key of state.checkboxes.keys()) {
    state.checkboxes.set(key, false);
  }
  const edittedPreset = await getPreset(id);
  if (edittedPreset === undefined) {
    Notifications.add("Preset not found", -1);
    return;
  }
  if (edittedPreset.config.settingGroups === undefined) {
    state.presetType = "full";
  } else {
    state.presetType = "partial";
    edittedPreset.config.settingGroups.forEach((currentActiveSettingGroup) =>
      state.checkboxes.set(currentActiveSettingGroup, true)
    );
  }
}

function addCheckboxListeners(): void {
  PresetSettingGroupSchema.options.forEach(
    (settingGroup: PresetSettingGroup) => {
      $(
        `#editPresetModal .modal .checkboxList .checkboxTitlePair[data-id="${settingGroup}"] input`
      ).on("change", (e) => {
        state.checkboxes.set(
          settingGroup,
          $(
            `#editPresetModal .modal .checkboxList .checkboxTitlePair[data-id="${settingGroup}"] input`
          ).prop("checked")
        );
      });
    }
  );
}

function addCheckBoxes(): void {
  function camelCaseToSpaced(input: string): string {
    return input.replace(/([a-z])([A-Z])/g, "$1 $2");
  }
  const settingGroupList = PresetSettingGroupSchema.options;
  const settingGroupListEl = $(
    "#editPresetModal .modal .inputs .checkboxList"
  ).empty();
  for (let index = 0; index < settingGroupList.length; index += 2) {
    const currSettingGroup = settingGroupList[index];
    if (currSettingGroup === undefined) {
      throw new Error("Error Occured While showing Setting Group Checkboxes");
    }
    const currSettingGroupTitle = camelCaseToSpaced(currSettingGroup);
    let rowElem: string = `<div class="checkboxTitlePair" data-id="${currSettingGroup}">
              <input type="checkbox" />
              <div class="title">${currSettingGroupTitle}</div>
            </div>`;
    if (index !== settingGroupList.length - 1) {
      const nextSettingGroup = settingGroupList[index + 1];
      if (nextSettingGroup === undefined) {
        throw new Error("Error Occured While showing Setting Group Checkboxes");
      }
      const nextSettingGroupTitle = camelCaseToSpaced(nextSettingGroup);
      rowElem = rowElem.concat(`
            <div class="checkboxTitlePair" data-id="${nextSettingGroup}">
              <input type="checkbox" />
              <div class="title">${nextSettingGroupTitle}</div>
          </div>`);
    }
    settingGroupListEl.append(
      `<div class="checkboxGroupRow">` + rowElem + `<div>`
    );
  }
  for (const key of state.checkboxes.keys()) {
    state.checkboxes.set(key, true);
  }
  addCheckboxListeners();
  updateUI();
}

function updateUI(): void {
  PresetSettingGroupSchema.options.forEach(
    (settingGroup: PresetSettingGroup) => {
      $(
        `#editPresetModal .modal .checkboxList .checkboxTitlePair[data-id="${settingGroup}"] input`
      ).prop("checked", state.checkboxes.get(settingGroup));
    }
  );
  $(`#editPresetModal .modal .presetType button`).removeClass("active");
  $(
    `#editPresetModal .modal .presetType button[value="${state.presetType}"]`
  ).addClass("active");
  $(`#editPresetModal .modal .checkboxList`).removeClass("hidden");
  if (state.presetType === "full") {
    $(`#editPresetModal .modal .checkboxList`).addClass("hidden");
  }
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
    if (Object.values(state.checkboxes).filter((val) => val).length > 0) {
      Notifications.add("Atleast one setting group must be active.");
      return;
    }
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
    if (Object.values(state.checkboxes).filter((val) => val).length > 0) {
      Notifications.add("Atleast one setting group must be active.");
      return;
    }
    const configChanges = getConfigChanges();
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
      preset.config = getActiveConfigChanges(preset.config);
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
      return "theme";

    case "showKeyTips":
    case "capsLockWarning":
    case "showOutOfFocusWarning":
    case "showAverage":
      return "hideElements";

    case "smoothCaret":
    case "caretStyle":
    case "paceCaretStyle":
    case "paceCaret":
    case "paceCaretCustomSpeed":
    case "repeatedPace":
      return "caret";

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
    case "tags":
      return "behaviour";

    case "punctuation":
    case "words":
    case "time":
    case "numbers":
    case "mode":
    case "quoteLength":
    case "language":
      return "test";

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
    case "maxLineWidth":
      return "appearance";

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
      return "input";

    case "playSoundOnError":
    case "playSoundOnClick":
    case "soundVolume":
      return "sound";

    case "accountChart":
    case "monkey":
    case "monkeyPowerLevel":
      return "hidden";

    case "ads":
      return "ads";
    default:
      break;
  }
  throw new Error(`${configFieldName} setting not part of any setting group`);
}

function getActiveConfigChanges(
  presetConfig: MonkeyTypes.PresetConfig | MonkeyTypes.ConfigChanges
): MonkeyTypes.ConfigChanges {
  const activeConfigChanges = {} as MonkeyTypes.PresetConfig;
  Object.keys(defaultConfig)
    .filter(
      (settingName) =>
        state.checkboxes.get(getSettingGroup(settingName)) === true
    )
    .forEach((settingName) => {
      //@ts-expect-error this is fine
      activeConfigChanges[settingName] =
        //@ts-expect-error this is fine
        presetConfig[settingName] !== undefined
          ? //@ts-expect-error this is fine
            presetConfig[settingName]
          : //@ts-expect-error this is fine
            defaultConfig[settingName];
    });
  return activeConfigChanges;
}
function getConfigChanges(): MonkeyTypes.ConfigChanges {
  const activeConfigChanges = getActiveConfigChanges(Config.getConfigChanges());
  const tags = DB.getSnapshot()?.tags ?? [];

  const activeTagIds: string[] = tags
    .filter((tag: MonkeyTypes.UserTag) => tag.active)
    .map((tag: MonkeyTypes.UserTag) => tag._id);

  return {
    ...activeConfigChanges,
    settingGroups: ActiveSettingGroupsSchema.parse(
      Array.from(state.checkboxes.entries())
        .filter(([, value]) => value)
        .map(([key]) => key)
    ),
    ...(state.checkboxes.get("behaviour") === true && {
      tags: activeTagIds,
    }),
  };
}

async function setup(modalEl: HTMLElement): Promise<void> {
  modalEl.addEventListener("submit", (e) => {
    e.preventDefault();
    void apply();
  });
}
const modal = new AnimatedModal({
  dialogId: "editPresetModal",
  setup,
});
