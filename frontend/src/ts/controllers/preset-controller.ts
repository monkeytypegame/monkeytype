import { Preset } from "@monkeytype/contracts/schemas/presets";
import * as UpdateConfig from "../config";
import * as DB from "../db";
import * as Notifications from "../elements/notifications";
import * as TestLogic from "../test/test-logic";
import { migrateConfig, replaceLegacyValues } from "../utils/config";
import * as TagController from "./tag-controller";

export async function apply(_id: string): Promise<void> {
  const snapshot = DB.getSnapshot();
  if (!snapshot) return;

  const presetToApply = snapshot.presets?.find((preset) => preset._id === _id);
  if (presetToApply === undefined) {
    return;
  }
  if (isPartialPreset(presetToApply)) {
    const combinedConfig = {
      ...UpdateConfig.getConfigChanges(),
      ...replaceLegacyValues(presetToApply.config),
    };
    await UpdateConfig.apply(migrateConfig(combinedConfig));
  } else {
    await UpdateConfig.apply(migrateConfig(presetToApply.config));
  }
  if (
    !isPartialPreset(presetToApply) ||
    presetToApply.settingGroups?.includes("behavior")
  ) {
    TagController.clear(true);
    if (presetToApply.config.tags) {
      for (const tagId of presetToApply.config.tags) {
        TagController.set(tagId, true, false);
      }
      TagController.saveActiveToLocalStorage();
    }
  }
  TestLogic.restart();
  Notifications.add("Preset applied", 1, {
    duration: 2,
  });
  UpdateConfig.saveFullConfigToLocalStorage();
}
function isPartialPreset(preset: DB.SnapshotPreset): boolean {
  return preset.settingGroups !== undefined && preset.settingGroups !== null;
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
