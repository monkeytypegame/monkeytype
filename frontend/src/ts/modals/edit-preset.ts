import Ape from "../ape";
import * as DB from "../db";
import * as Config from "../config";
import * as Loader from "../elements/loader";
import * as Settings from "../pages/settings";
import * as Notifications from "../elements/notifications";
import * as ConnectionState from "../states/connection";
import AnimatedModal from "../utils/animated-modal";
import {
  ActiveSettingGroups,
  ActiveSettingGroupsSchema,
  PresetSettingGroup,
  PresetSettingGroupSchema,
  PresetType,
  PresetTypeSchema,
} from "@monkeytype/contracts/schemas/presets";
import { getPreset } from "../controllers/preset-controller";
import defaultConfig from "../constants/default-config";
import { Config as ConfigType } from "@monkeytype/contracts/schemas/configs";

const state = {
  presetType: "full" as PresetType,
  checkboxes: new Map(
    PresetSettingGroupSchema.options.map((key: PresetSettingGroup) => [
      key,
      true,
    ])
  ),
  setPresetToCurrent: false,
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
      addCheckBoxes();
      if (action === "add") {
        $("#editPresetModal .modal").attr("data-action", "add");
        $("#editPresetModal .modal .popupTitle").html("Add new preset");
        $("#editPresetModal .modal .submit").html(`add`);
        $("#editPresetModal .modal input").val("");
        $("#editPresetModal .modal input").removeClass("hidden");
        $(
          "#editPresetModal .modal label.changePresetToCurrentCheckbox"
        ).addClass("hidden");
        $("#editPresetModal .modal .inputs").removeClass("hidden");
        $("#editPresetModal .modal .presetType").removeClass("hidden");
        $("#editPresetModal .modal .presetNameTitle").removeClass("hidden");
        state.presetType = "full";
      } else if (action === "edit" && id !== undefined && name !== undefined) {
        $("#editPresetModal .modal").attr("data-action", "edit");
        $("#editPresetModal .modal").attr("data-preset-id", id);
        $("#editPresetModal .modal .popupTitle").html("Edit preset");
        $("#editPresetModal .modal .submit").html(`save`);
        $("#editPresetModal .modal input").val(name);
        $("#editPresetModal .modal input").removeClass("hidden");
        $(
          "#editPresetModal .modal label.changePresetToCurrentCheckbox"
        ).removeClass("hidden");
        $("#editPresetModal .modal .presetNameTitle").removeClass("hidden");
        state.setPresetToCurrent = false;
        await updateEditPresetUI();
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
        $(
          "#editPresetModal .modal label.changePresetToCurrentCheckbox"
        ).addClass("hidden");
        $("#editPresetModal .modal .text").removeClass("hidden");
        $("#editPresetModal .modal .deletePrompt").text(
          `Are you sure you want to delete the preset ${name}?`
        );
        $("#editPresetModal .modal .inputs").addClass("hidden");
        $("#editPresetModal .modal .presetType").addClass("hidden");
        $("#editPresetModal .modal .presetNameTitle").addClass("hidden");
      }
      updateUI();
    },
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
  if (
    edittedPreset.settingGroups === undefined ||
    edittedPreset.settingGroups === null
  ) {
    state.presetType = "full";
    for (const key of state.checkboxes.keys()) {
      state.checkboxes.set(key, true);
    }
  } else {
    state.presetType = "partial";
    edittedPreset.settingGroups.forEach((currentActiveSettingGroup) =>
      state.checkboxes.set(currentActiveSettingGroup, true)
    );
  }
  state.setPresetToCurrent = false;
  updateUI();
}

function addCheckboxListeners(): void {
  PresetSettingGroupSchema.options.forEach(
    (settingGroup: PresetSettingGroup) => {
      const checkboxInput = $(
        `#editPresetModal .modal .checkboxList .checkboxTitlePair[data-id="${settingGroup}"] input`
      );
      checkboxInput.on("change", (e) => {
        state.checkboxes.set(
          settingGroup,
          checkboxInput.prop("checked") as boolean
        );
      });
    }
  );

  const presetToCurrentCheckbox = $(
    `#editPresetModal .modal .changePresetToCurrentCheckbox input`
  );
  presetToCurrentCheckbox.on("change", async () => {
    state.setPresetToCurrent = presetToCurrentCheckbox.prop(
      "checked"
    ) as boolean;
    await updateEditPresetUI();
  });
}

function addCheckBoxes(): void {
  function camelCaseToSpaced(input: string): string {
    return input.replace(/([a-z])([A-Z])/g, "$1 $2");
  }
  const settingGroupListEl = $(
    "#editPresetModal .modal .inputs .checkboxList"
  ).empty();
  PresetSettingGroupSchema.options.forEach((currSettingGroup) => {
    const currSettingGroupTitle = camelCaseToSpaced(currSettingGroup);
    const settingGroupCheckbox: string = `<label class="checkboxTitlePair" data-id="${currSettingGroup}">
              <input type="checkbox" />
              <div class="title">${currSettingGroupTitle}</div>
              </label>`;
    settingGroupListEl.append(settingGroupCheckbox);
  });
  for (const key of state.checkboxes.keys()) {
    state.checkboxes.set(key, true);
  }
  addCheckboxListeners();
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
  $(`#editPresetModal .modal .partialPresetGroups`).removeClass("hidden");
  if (state.presetType === "full") {
    $(`#editPresetModal .modal .partialPresetGroups`).addClass("hidden");
  }
}
async function updateEditPresetUI(): Promise<void> {
  $("#editPresetModal .modal label.changePresetToCurrentCheckbox input").prop(
    "checked",
    state.setPresetToCurrent
  );
  if (state.setPresetToCurrent) {
    const presetId = $("#editPresetModal .modal").attr(
      "data-preset-id"
    ) as string;
    await initializeEditState(presetId);
    $("#editPresetModal .modal .inputs").removeClass("hidden");
    $("#editPresetModal .modal .presetType").removeClass("hidden");
  } else {
    $("#editPresetModal .modal .inputs").addClass("hidden");
    $("#editPresetModal .modal .presetType").addClass("hidden");
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

  const updateConfig = $("#editPresetModal .modal label input").prop(
    "checked"
  ) as boolean;

  const snapshotPresets = DB.getSnapshot()?.presets ?? [];

  if (action === undefined) {
    return;
  }

  const noPartialGroupSelected: boolean =
    ["add", "edit"].includes(action) &&
    state.presetType === "partial" &&
    Array.from(state.checkboxes.values()).every((val: boolean) => !val);
  if (noPartialGroupSelected) {
    Notifications.add(
      "At least one setting group must be active while saving partial presets",
      0
    );
    return;
  }

  const noPresetName: boolean =
    ["add", "edit"].includes(action) &&
    presetName.replace(/^_+|_+$/g, "").length === 0; //all whitespace names are rejected
  if (noPresetName) {
    Notifications.add("Preset name cannot be empty", 0);
    return;
  }

  hide();

  Loader.show();

  if (action === "add") {
    const configChanges = getConfigChanges();
    const activeSettingGroups = getActiveSettingGroupsFromState();
    const response = await Ape.presets.add({
      body: {
        name: presetName,
        config: configChanges,
        ...(state.presetType === "partial" && {
          settingGroups: activeSettingGroups,
        }),
      },
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
        ...(state.presetType === "partial" && {
          settingGroups: activeSettingGroups,
        }),
        display: propPresetName,
        _id: response.body.data.presetId,
      } as DB.SnapshotPreset);
    }
  } else if (action === "edit") {
    const preset = snapshotPresets.filter(
      (preset: DB.SnapshotPreset) => preset._id === presetId
    )[0] as DB.SnapshotPreset;
    if (preset === undefined) {
      Notifications.add("Preset not found", -1);
      return;
    }
    const configChanges = getConfigChanges();
    const activeSettingGroups: ActiveSettingGroups | null =
      state.presetType === "partial" ? getActiveSettingGroupsFromState() : null;
    const response = await Ape.presets.save({
      body: {
        _id: presetId,
        name: presetName,
        ...(updateConfig && {
          config: configChanges,
          settingGroups: activeSettingGroups,
        }),
      },
    });

    if (response.status !== 200) {
      Notifications.add("Failed to edit preset: " + response.body.message, -1);
    } else {
      Notifications.add("Preset updated", 1);

      preset.name = presetName;
      preset.display = presetName.replace(/_/g, " ");
      if (updateConfig) {
        preset.config = configChanges;
        if (state.presetType === "partial") {
          preset.settingGroups = getActiveSettingGroupsFromState();
        } else {
          preset.settingGroups = null;
        }
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
      snapshotPresets.forEach((preset: DB.SnapshotPreset, index: number) => {
        if (preset._id === presetId) {
          snapshotPresets.splice(index, 1);
        }
      });
    }
  }

  void Settings.update();
  Loader.hide();
}

function getSettingGroup(configFieldName: string): PresetSettingGroup {
  const themeSettings = [
    "theme",
    "themeLight",
    "themeDark",
    "autoSwitchTheme",
    "customTheme",
    "customThemeColors",
    "favThemes",
    "flipTestColors",
    "colorfulMode",
    "randomTheme",
    "customBackground",
    "customBackgroundSize",
    "customBackgroundFilter",
  ];
  const hideElementsSettings = [
    "showKeyTips",
    "capsLockWarning",
    "showOutOfFocusWarning",
    "showAverage",
  ];
  const caretSettings = [
    "smoothCaret",
    "caretStyle",
    "paceCaretStyle",
    "paceCaret",
    "paceCaretCustomSpeed",
    "repeatedPace",
  ];
  const behaviorSettings = [
    "quickRestart",
    "difficulty",
    "blindMode",
    "funbox",
    "alwaysShowWordsHistory",
    "singleListCommandLine",
    "minWpm",
    "minWpmCustomSpeed",
    "minAcc",
    "minAccCustom",
    "repeatQuotes",
    "customLayoutfluid",
    "minBurst",
    "minBurstCustomSpeed",
    "britishEnglish",
    "tags",
  ];
  const testSettings = [
    "punctuation",
    "words",
    "time",
    "numbers",
    "mode",
    "quoteLength",
    "language",
    "burstHeatmap",
  ];
  const appearanceSettings = [
    "fontSize",
    "timerStyle",
    "liveSpeedStyle",
    "liveAccStyle",
    "liveBurstStyle",
    "timerColor",
    "timerOpacity",
    "showAllLines",
    "keymapMode",
    "keymapStyle",
    "keymapLegendStyle",
    "keymapLayout",
    "keymapShowTopRow",
    "keymapSize",
    "fontFamily",
    "smoothLineScroll",
    "alwaysShowDecimalPlaces",
    "startGraphsAtZero",
    "highlightMode",
    "tapeMode",
    "typingSpeedUnit",
    "maxLineWidth",
  ];
  const inputSettings = [
    "freedomMode",
    "quickEnd",
    "layout",
    "confidenceMode",
    "indicateTypos",
    "stopOnError",
    "hideExtraLetters",
    "strictSpace",
    "oppositeShiftMode",
    "lazyMode",
  ];
  const soundSettings = ["playSoundOnError", "playSoundOnClick", "soundVolume"];
  const hiddenSettings = ["accountChart", "monkey", "monkeyPowerLevel"];
  const adsSettings = ["ads"];

  if (themeSettings.includes(configFieldName)) {
    return "theme";
  } else if (hideElementsSettings.includes(configFieldName)) {
    return "hideElements";
  } else if (caretSettings.includes(configFieldName)) {
    return "caret";
  } else if (behaviorSettings.includes(configFieldName)) {
    return "behavior";
  } else if (testSettings.includes(configFieldName)) {
    return "test";
  } else if (appearanceSettings.includes(configFieldName)) {
    return "appearance";
  } else if (inputSettings.includes(configFieldName)) {
    return "input";
  } else if (soundSettings.includes(configFieldName)) {
    return "sound";
  } else if (hiddenSettings.includes(configFieldName)) {
    return "hidden";
  } else if (adsSettings.includes(configFieldName)) {
    return "ads";
  }

  throw new Error(`${configFieldName} setting not part of any setting group`);
}

function getPartialConfigChanges(
  configChanges: Partial<ConfigType>
): Partial<ConfigType> {
  const activeConfigChanges: Partial<ConfigType> = {};
  Object.keys(defaultConfig)
    .filter(
      (settingName) =>
        state.checkboxes.get(getSettingGroup(settingName)) === true
    )
    .forEach((settingName) => {
      const safeSettingName = settingName as keyof Partial<ConfigType>;
      const newValue =
        configChanges[safeSettingName] !== undefined
          ? configChanges[safeSettingName]
          : defaultConfig[safeSettingName];
      // @ts-expect-error cant figure this one out, but it works
      activeConfigChanges[safeSettingName] = newValue;
    });
  return activeConfigChanges;
}
function getActiveSettingGroupsFromState(): ActiveSettingGroups {
  return ActiveSettingGroupsSchema.parse(
    Array.from(state.checkboxes.entries())
      .filter(([, value]) => value)
      .map(([key]) => key)
  );
}
function getConfigChanges(): Partial<ConfigType> {
  const activeConfigChanges =
    state.presetType === "partial"
      ? getPartialConfigChanges(Config.getConfigChanges())
      : Config.getConfigChanges();
  const tags = DB.getSnapshot()?.tags ?? [];

  const activeTagIds: string[] = tags
    .filter((tag) => tag.active)
    .map((tag) => tag._id);

  const setTags: boolean =
    state.presetType === "full" || state.checkboxes.get("behavior") === true;
  return {
    ...activeConfigChanges,
    ...(setTags && {
      tags: activeTagIds,
    }),
  };
}

async function setup(modalEl: HTMLElement): Promise<void> {
  modalEl.addEventListener("submit", (e) => {
    e.preventDefault();
    void apply();
  });
  PresetTypeSchema.options.forEach((presetType) => {
    const presetOption = modalEl.querySelector(
      `.presetType button[value="${presetType}"]`
    );
    if (presetOption === null) return;

    presetOption.addEventListener("click", () => {
      state.presetType = presetType;
      updateUI();
    });
  });
}
const modal = new AnimatedModal({
  dialogId: "editPresetModal",
  setup,
});
