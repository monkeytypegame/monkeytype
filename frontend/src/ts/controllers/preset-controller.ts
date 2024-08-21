import {
  Preset,
  presetSettingGroupSchema,
} from "@monkeytype/contracts/schemas/presets";
import * as UpdateConfig from "../config";
import * as DB from "../db";
import * as Notifications from "../elements/notifications";
import * as TestLogic from "../test/test-logic";
import { replaceLegacyValues } from "../utils/config";
import * as TagController from "./tag-controller";
import defaultConfig from "../constants/default-config";

export async function apply(_id: string): Promise<void> {
  const snapshot = DB.getSnapshot();
  if (!snapshot) return;

  const presetToApply = snapshot.presets?.find((preset) => preset._id === _id);
  if (presetToApply === undefined) {
    Notifications.add("Preset not found", 0);
    return;
  }
  if (presetToApply.config.settingGroups === undefined) {
    migrateLegacyPresets(presetToApply);
  }

  await UpdateConfig.selectiveApply(
    replaceLegacyValues(presetToApply.config),
    UpdateConfig.getConfigChanges()
  );
  TagController.clear(true);
  if (presetToApply.config.tags) {
    for (const tagId of presetToApply.config.tags) {
      TagController.set(tagId, true, false);
    }
    TagController.saveActiveToLocalStorage();
  }
  TestLogic.restart();
  Notifications.add("Preset applied", 1, {
    duration: 2,
  });
  UpdateConfig.saveFullConfigToLocalStorage();
}

function migrateLegacyPresets(presetToApply: MonkeyTypes.SnapshotPreset): void {
  Object.keys(defaultConfig).forEach((settingFieldName) => {
    //@ts-expect-error this is fine
    if (presetToApply.config[settingFieldName] === undefined) {
      //@ts-expect-error this is fine
      presetToApply.config[settingFieldName] =
        //@ts-expect-error this is fine
        defaultConfig[settingFieldName];
    }
  });
  presetToApply.config.settingGroups = presetSettingGroupSchema.options;
}

export async function getPreset(_id: string): Promise<Preset | undefined> {
  const snapshot = DB.getSnapshot();
  if (!snapshot) {
    return;
  }

  const preset = snapshot.presets?.find((preset) => preset._id === _id);

  if (preset === undefined) {
    Notifications.add("Preset not found", 0);
    return;
  }
  return preset;
}
