import * as DB from "../db";
import { showLoaderBar, hideLoaderBar } from "../states/loader-bar";
import * as Settings from "../pages/settings";
import {
  showNoticeNotification,
  showErrorNotification,
  showSuccessNotification,
} from "../states/notifications";
import AnimatedModal from "../utils/animated-modal";
import {
  PresetNameSchema,
  PresetType,
  PresetTypeSchema,
} from "@monkeytype/schemas/presets";
import {
  getPreset,
  addPreset,
  editPreset,
  deletePreset,
} from "../collections/presets";
import {
  ConfigGroupName,
  ConfigGroupNameSchema,
  ConfigKey,
  Config as ConfigType,
} from "@monkeytype/schemas/configs";
import { getDefaultConfig } from "../constants/default-config";
import { ValidatedHtmlInputElement } from "../elements/input-validation";
import { ElementWithUtils } from "../utils/dom";
import { configMetadata } from "../config/metadata";
import { getConfigChanges as getConfigChangesFromConfig } from "../config/utils";
import { normalizeName } from "../utils/strings";

const state = {
  presetType: "full" as PresetType,
  checkboxes: new Map(
    ConfigGroupNameSchema.options.map((key: ConfigGroupName) => [key, true]),
  ),
  setPresetToCurrent: false,
};

let presetNameEl: ValidatedHtmlInputElement | null = null;

export function show(action: string, id?: string, name?: string): void {
  void modal.show({
    focusFirstInput: true,
    beforeAnimation: async (modalEl) => {
      modalEl.qsr(".text").hide();
      addCheckBoxes();
      presetNameEl ??= new ValidatedHtmlInputElement(
        modalEl.qsr("input[type=text]"),
        {
          isValid: async (name) => {
            const parsed = PresetNameSchema.safeParse(normalizeName(name));
            if (parsed.success) return true;
            return parsed.error.errors.map((err) => err.message).join(", ");
          },
          debounceDelay: 0,
        },
      );
      if (action === "add") {
        modalEl.setAttribute("data-action", "add");
        modalEl.qsr(".popupTitle").setHtml("Add new preset");
        modalEl.qsr(".submit").setHtml("add");
        presetNameEl.setValue(null);
        presetNameEl.getParent()?.show();
        modalEl.qsa("input").show();
        modalEl.qsr("label.changePresetToCurrentCheckbox").hide();
        modalEl.qsr(".inputs").show();
        modalEl.qsr(".presetType").show();
        modalEl.qsr(".presetNameTitle").show();
        state.presetType = "full";
      } else if (action === "edit" && id !== undefined && name !== undefined) {
        modalEl.setAttribute("data-action", "edit");
        modalEl.setAttribute("data-preset-id", id);
        modalEl.qsr(".popupTitle").setHtml("Edit preset");
        modalEl.qsr(".submit").setHtml(`save`);
        presetNameEl?.setValue(name);
        presetNameEl?.getParent()?.show();

        modalEl.qsa("input").show();
        modalEl.qsr("label.changePresetToCurrentCheckbox").show();
        modalEl.qsr(".presetNameTitle").show();
        state.setPresetToCurrent = false;
        updateEditPresetUI();
      } else if (
        action === "remove" &&
        id !== undefined &&
        name !== undefined
      ) {
        modalEl.setAttribute("data-action", "remove");
        modalEl.setAttribute("data-preset-id", id);
        modalEl.qsr(".popupTitle").setHtml("Delete preset");
        modalEl.qsr(".submit").setHtml("delete");
        modalEl.qsa("input").hide();
        modalEl.qsr("label.changePresetToCurrentCheckbox").hide();
        modalEl.qsr(".text").show();
        modalEl
          .qsr(".deletePrompt")
          .setText(`Are you sure you want to delete the preset ${name}?`);
        modalEl.qsr(".inputs").hide();
        modalEl.qsr(".presetType").hide();
        modalEl.qsr(".presetNameTitle").hide();
        presetNameEl?.getParent()?.hide();
      }
      updateUI();
    },
  });
}

function initializeEditState(id: string): void {
  for (const key of state.checkboxes.keys()) {
    state.checkboxes.set(key, false);
  }
  const edittedPreset = getPreset(id);
  if (edittedPreset === undefined) {
    showErrorNotification("Preset not found");
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
  const modalEl = modal.getModal();
  ConfigGroupNameSchema.options.forEach((settingGroup: ConfigGroupName) => {
    const checkboxInput = modalEl.qsr<HTMLInputElement>(
      `.checkboxList .checkboxTitlePair[data-id="${settingGroup}"] input`,
    );

    checkboxInput.on("change", async () => {
      state.checkboxes.set(settingGroup, checkboxInput.isChecked() as boolean);
    });
  });

  const presetToCurrentCheckbox = modalEl.qsr<HTMLInputElement>(
    `.changePresetToCurrentCheckbox input`,
  );
  presetToCurrentCheckbox.on("change", () => {
    state.setPresetToCurrent = presetToCurrentCheckbox.isChecked() as boolean;
    updateEditPresetUI();
  });
}

function addCheckBoxes(): void {
  const modalEl = modal.getModal();
  function camelCaseToSpaced(input: string): string {
    return input.replace(/([a-z])([A-Z])/g, "$1 $2");
  }
  const settingGroupListEl = modalEl.qsr(".inputs .checkboxList").empty();

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
  const modalEl = modal.getModal();
  ConfigGroupNameSchema.options.forEach((settingGroup: ConfigGroupName) => {
    if (state.checkboxes.get(settingGroup)) {
      modalEl
        .qsr<HTMLInputElement>(
          `.checkboxList .checkboxTitlePair[data-id="${settingGroup}"] input`,
        )
        .setChecked(true);
    } else {
      modalEl
        .qsr<HTMLInputElement>(
          `.checkboxList .checkboxTitlePair[data-id="${settingGroup}"] input`,
        )
        .setChecked(false);
    }
  });

  modalEl.qsa(".presetType button").removeClass("active");
  modalEl
    .qsr(`.presetType button[value="${state.presetType}"]`)
    .addClass("active");
  modalEl.qsr(`.partialPresetGroups`).show();
  if (state.presetType === "full") {
    modalEl.qsr(".partialPresetGroups").hide();
  }
}
function updateEditPresetUI(): void {
  const modalEl = modal.getModal();
  if (state.setPresetToCurrent) {
    modalEl
      .qsr<HTMLInputElement>("label.changePresetToCurrentCheckbox input")
      .setChecked(true);
    const presetId = modalEl.getAttribute("data-preset-id") as string;
    initializeEditState(presetId);
    modalEl.qsr(".inputs").show();
    modalEl.qsr(".presetType").show();
  } else {
    modalEl
      .qsr<HTMLInputElement>("label.changePresetToCurrentCheckbox input")
      .setChecked(false);
    modalEl.qsr(".inputs").hide();
    modalEl.qsr(".presetType").hide();
  }
}

function hide(): void {
  void modal.hide();
}

async function apply(): Promise<void> {
  const modalEl = modal.getModal();
  const action = modalEl.getAttribute("data-action");
  const propPresetName = modalEl
    .qsr<HTMLInputElement>(".group input[title='presets']")
    .getValue() as string;
  const presetId = modalEl.getAttribute("data-preset-id") as string;

  const updateConfig = modalEl
    .qsr<HTMLInputElement>("label.changePresetToCurrentCheckbox input")
    .isChecked();

  if (action === null || action === "") {
    return;
  }

  const noPartialGroupSelected: boolean =
    ["add", "edit"].includes(action) &&
    state.presetType === "partial" &&
    Array.from(state.checkboxes.values()).every((val: boolean) => !val);
  if (noPartialGroupSelected) {
    showNoticeNotification(
      "At least one setting group must be active while saving partial presets",
    );
    return;
  }

  const addOrEditAction = action === "add" || action === "edit";

  if (addOrEditAction && propPresetName.trim().length === 0) {
    showNoticeNotification("Preset name cannot be empty");
    return;
  }

  const cleanedPresetName = normalizeName(propPresetName);
  const parsedPresetName = addOrEditAction
    ? PresetNameSchema.safeParse(cleanedPresetName)
    : null;

  if (parsedPresetName && !parsedPresetName.success) {
    showNoticeNotification("Preset name is not valid");
    return;
  }

  const presetName = parsedPresetName?.data ?? "";

  hide();

  showLoaderBar();

  try {
    if (action === "add") {
      const configChanges = getConfigChanges();
      const activeSettingGroups = getActiveSettingGroupsFromState();
      await addPreset({
        name: presetName,
        config: configChanges,
        settingGroups:
          state.presetType === "partial" ? activeSettingGroups : undefined,
      });
      showSuccessNotification("Preset added", { durationMs: 2000 });
    } else if (action === "edit") {
      const existing = getPreset(presetId);
      if (existing === undefined) {
        showErrorNotification("Preset not found");
        return;
      }
      const configChanges = getConfigChanges();
      const activeSettingGroups: ConfigGroupName[] | null =
        state.presetType === "partial"
          ? getActiveSettingGroupsFromState()
          : null;
      await editPreset({
        presetId,
        name: presetName,
        config: updateConfig ? configChanges : undefined,
        settingGroups: updateConfig ? activeSettingGroups : undefined,
      });
      showSuccessNotification("Preset updated");
    } else if (action === "remove") {
      await deletePreset({ presetId });
      showSuccessNotification("Preset removed");
    }
  } catch (e) {
    showErrorNotification(
      e instanceof Error ? e.message : "Failed to update preset",
    );
  }

  void Settings.update();
  hideLoaderBar();
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
      ? getPartialConfigChanges(getConfigChangesFromConfig())
      : getConfigChangesFromConfig();
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
