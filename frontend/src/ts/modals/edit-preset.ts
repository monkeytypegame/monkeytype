import Ape from "../ape";
import * as DB from "../db";
import * as Config from "../config";
import * as Loader from "../elements/loader";
import * as Settings from "../pages/settings";
import * as Notifications from "../elements/notifications";
import * as ConnectionState from "../states/connection";
import AnimatedModal from "../utils/animated-modal";
import {
  PresetNameSchema,
  PresetType,
  PresetTypeSchema,
} from "@monkeytype/schemas/presets";
import { getPreset } from "../controllers/preset-controller";
import {
  ConfigGroupName,
  ConfigGroupNameSchema,
  ConfigKey,
  Config as ConfigType,
} from "@monkeytype/schemas/configs";
import { getDefaultConfig } from "../constants/default-config";
import { SnapshotPreset } from "../constants/default-snapshot";
import { ValidatedHtmlInputElement } from "../elements/input-validation";
import { qsa, ElementWithUtils, qsr } from "../utils/dom";
import { configMetadata } from "../config-metadata";

const state = {
  presetType: "full" as PresetType,
  checkboxes: new Map(
    ConfigGroupNameSchema.options.map((key: ConfigGroupName) => [key, true]),
  ),
  setPresetToCurrent: false,
};

let presetNameEl: ValidatedHtmlInputElement | null = null;

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
      qsr("#editPresetModal .modal .text").hide();
      addCheckBoxes();
      presetNameEl ??= new ValidatedHtmlInputElement(
        qsr("#editPresetModal .modal input[type=text]"),
        {
          schema: PresetNameSchema,
        },
      );
      if (action === "add") {
        qsr("#editPresetModal .modal").setAttribute("data-action", "add");
        qsr("#editPresetModal .modal .popupTitle").setHtml("Add new preset");
        qsr("#editPresetModal .modal .submit").setHtml("add");
        presetNameEl.setValue(null);
        presetNameEl.getParent()?.show();
        qsa("#editPresetModal .modal input").show();
        qsr(
          "#editPresetModal .modal label.changePresetToCurrentCheckbox",
        ).hide();
        qsr("#editPresetModal .modal .inputs").show();
        qsr("#editPresetModal .modal .presetType").show();
        qsr("#editPresetModal .modal .presetNameTitle").show();
        state.presetType = "full";
      } else if (action === "edit" && id !== undefined && name !== undefined) {
        qsr("#editPresetModal .modal").setAttribute("data-action", "edit");
        qsr("#editPresetModal .modal").setAttribute("data-preset-id", id);
        qsr("#editPresetModal .modal .popupTitle").setHtml("Edit preset");
        qsr("#editPresetModal .modal .submit").setHtml(`save`);
        presetNameEl?.setValue(name);
        presetNameEl?.getParent()?.show();

        qsa("#editPresetModal .modal input").show();
        qsr(
          "#editPresetModal .modal label.changePresetToCurrentCheckbox",
        ).show();
        qsr("#editPresetModal .modal .presetNameTitle").show();
        state.setPresetToCurrent = false;
        await updateEditPresetUI();
      } else if (
        action === "remove" &&
        id !== undefined &&
        name !== undefined
      ) {
        qsr("#editPresetModal .modal").setAttribute("data-action", "remove");
        qsr("#editPresetModal .modal").setAttribute("data-preset-id", id);
        qsr("#editPresetModal .modal .popupTitle").setHtml("Delete preset");
        qsr("#editPresetModal .modal .submit").setHtml("delete");
        qsa("#editPresetModal .modal input").hide();
        qsr(
          "#editPresetModal .modal label.changePresetToCurrentCheckbox",
        ).hide();
        qsr("#editPresetModal .modal .text").show();
        qsr("#editPresetModal .modal .deletePrompt").setText(
          `Are you sure you want to delete the preset ${name}?`,
        );
        qsr("#editPresetModal .modal .inputs").hide();
        qsr("#editPresetModal .modal .presetType").hide();
        qsr("#editPresetModal .modal .presetNameTitle").hide();
        presetNameEl?.getParent()?.hide();
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
      state.checkboxes.set(currentActiveSettingGroup, true),
    );
  }
  state.setPresetToCurrent = false;
  updateUI();
}

function addCheckboxListeners(): void {
  ConfigGroupNameSchema.options.forEach((settingGroup: ConfigGroupName) => {
    const checkboxInput = qsr<HTMLInputElement>(
      `#editPresetModal .modal .checkboxList .checkboxTitlePair[data-id="${settingGroup}"] input`,
    );

    checkboxInput.on("change", async () => {
      state.checkboxes.set(settingGroup, checkboxInput.isChecked() as boolean);
    });
  });

  const presetToCurrentCheckbox = qsr<HTMLInputElement>(
    `#editPresetModal .modal .changePresetToCurrentCheckbox input`,
  );
  presetToCurrentCheckbox.on("change", async () => {
    state.setPresetToCurrent = presetToCurrentCheckbox.isChecked() as boolean;
    await updateEditPresetUI();
  });
}

function addCheckBoxes(): void {
  function camelCaseToSpaced(input: string): string {
    return input.replace(/([a-z])([A-Z])/g, "$1 $2");
  }
  const settingGroupListEl = qsr(
    "#editPresetModal .modal .inputs .checkboxList",
  ).empty();

  ConfigGroupNameSchema.options.forEach((currSettingGroup) => {
    const currSettingGroupTitle = camelCaseToSpaced(currSettingGroup);
    const settingGroupCheckbox: string = `<label class="checkboxTitlePair" data-id="${currSettingGroup}">
              <input type="checkbox" />
              <div class="title">${currSettingGroupTitle}</div>
              </label>`;
    settingGroupListEl.appendHtml(settingGroupCheckbox);
  });
  for (const key of state.checkboxes.keys()) {
    state.checkboxes.set(key, true);
  }
  addCheckboxListeners();
}

function updateUI(): void {
  ConfigGroupNameSchema.options.forEach((settingGroup: ConfigGroupName) => {
    if (state.checkboxes.get(settingGroup)) {
      qsr(
        `#editPresetModal .modal .checkboxList .checkboxTitlePair[data-id="${settingGroup}"] input`,
      ).setAttribute("checked", "true");
    } else {
      qsr(
        `#editPresetModal .modal .checkboxList .checkboxTitlePair[data-id="${settingGroup}"] input`,
      ).removeAttribute("checked");
    }
  });

  qsa(`#editPresetModal .modal .presetType button`).removeClass("active");
  qsr(
    `#editPresetModal .modal .presetType button[value="${state.presetType}"]`,
  ).addClass("active");
  qsr(`#editPresetModal .modal .partialPresetGroups`).show();
  if (state.presetType === "full") {
    qsr(`#editPresetModal .modal .partialPresetGroups`).hide();
  }
}
async function updateEditPresetUI(): Promise<void> {
  if (state.setPresetToCurrent) {
    qsr(
      "#editPresetModal .modal label.changePresetToCurrentCheckbox input",
    ).setAttribute("checked", "true");
    const presetId = qsr("#editPresetModal .modal").getAttribute(
      "data-preset-id",
    ) as string;
    await initializeEditState(presetId);
    qsr("#editPresetModal .modal .inputs").show();
    qsr("#editPresetModal .modal .presetType").show();
  } else {
    qsr(
      "#editPresetModal .modal label.changePresetToCurrentCheckbox input",
    ).removeAttribute("checked");
    qsr("#editPresetModal .modal .inputs").hide();
    qsr("#editPresetModal .modal .presetType").hide();
  }
}

function hide(): void {
  void modal.hide();
}

async function apply(): Promise<void> {
  const action = qsr("#editPresetModal .modal").getAttribute("data-action");
  const propPresetName = qsa<HTMLInputElement>(
    "#editPresetModal .modal input",
  )[0]?.getValue() as string;
  const presetName = propPresetName.replaceAll(" ", "_");
  const presetId = qsr("#editPresetModal .modal").getAttribute(
    "data-preset-id",
  ) as string;

  const updateConfig = qsa<HTMLInputElement>(
    "#editPresetModal .modal label input",
  )[0]?.isChecked();

  const snapshotPresets = DB.getSnapshot()?.presets ?? [];

  if (action === null) {
    return;
  }

  console.log({ updateConfig, propPresetName });

  const noPartialGroupSelected: boolean =
    ["add", "edit"].includes(action) &&
    state.presetType === "partial" &&
    Array.from(state.checkboxes.values()).every((val: boolean) => !val);
  if (noPartialGroupSelected) {
    Notifications.add(
      "At least one setting group must be active while saving partial presets",
      0,
    );
    return;
  }

  const addOrEditAction = action === "add" || action === "edit";
  if (addOrEditAction) {
    //validate the preset name only in add or edit mode

    const noPresetName: boolean =
      presetName.replace(/^_+|_+$/g, "").length === 0; //all whitespace names are rejected
    if (noPresetName) {
      Notifications.add("Preset name cannot be empty", 0);
      return;
    }

    if (presetNameEl?.getValidationResult().status === "failed") {
      Notifications.add("Preset name is not valid", 0);
      return;
    }
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
        "Failed to add preset" +
          response.body.message.replace(presetName, propPresetName),
        -1,
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
      } as SnapshotPreset);
    }
  } else if (action === "edit") {
    const preset = snapshotPresets.find(
      (preset: SnapshotPreset) => preset._id === presetId,
    ) as SnapshotPreset;
    if (preset === undefined) {
      Notifications.add("Preset not found", -1);
      return;
    }
    const configChanges = getConfigChanges();
    const activeSettingGroups: ConfigGroupName[] | null =
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
      Notifications.add("Failed to edit preset", -1, { response });
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
      Notifications.add("Failed to remove preset", -1, { response });
    } else {
      Notifications.add("Preset removed", 1);
      snapshotPresets.forEach((preset: SnapshotPreset, index: number) => {
        if (preset._id === presetId) {
          snapshotPresets.splice(index, 1);
        }
      });
    }
  }

  void Settings.update();
  Loader.hide();
}

function getSettingGroup(configFieldName: ConfigKey): ConfigGroupName {
  return configMetadata[configFieldName].group;
}

function getPartialConfigChanges(
  configChanges: Partial<ConfigType>,
): Partial<ConfigType> {
  const activeConfigChanges: Partial<ConfigType> = {};
  const defaultConfig = getDefaultConfig();

  (Object.keys(defaultConfig) as ConfigKey[])
    .filter((settingName) => {
      const group = getSettingGroup(settingName);
      if (group === null) return false;
      return state.checkboxes.get(group) === true;
    })
    .forEach((settingName) => {
      const safeSettingName = settingName;
      const newValue =
        configChanges[safeSettingName] ?? defaultConfig[safeSettingName];
      // @ts-expect-error cant figure this one out, but it works
      activeConfigChanges[safeSettingName] = newValue;
    });
  return activeConfigChanges;
}

function getActiveSettingGroupsFromState(): ConfigGroupName[] {
  return Array.from(state.checkboxes.entries())
    .filter(([, value]) => value)
    .map(([key]) => key);
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

async function setup(modalEl: ElementWithUtils): Promise<void> {
  modalEl.on("submit", (e) => {
    e.preventDefault();
    void apply();
  });
  PresetTypeSchema.options.forEach((presetType) => {
    const presetOption = modalEl.qs(
      `.presetType button[value="${presetType}"]`,
    );
    if (presetOption === null) return;

    presetOption.on("click", () => {
      state.presetType = presetType;
      updateUI();
    });
  });
}
const modal = new AnimatedModal({
  dialogId: "editPresetModal",
  setup,
});
