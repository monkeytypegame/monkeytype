import { Preset } from "@monkeytype/schemas/presets";
import Config, { applyConfig, saveFullConfigToLocalStorage } from "../config";
import * as DB from "../db";
import { showNotice, showSuccess } from "../stores/notifications";
import * as TestLogic from "../test/test-logic";
import * as TagController from "./tag-controller";
import { SnapshotPreset } from "../constants/default-snapshot";

export async function apply(_id: string): Promise<void> {
  const snapshot = DB.getSnapshot();
  if (!snapshot) return;

  const presetToApply = snapshot.presets?.find((preset) => preset._id === _id);
  if (presetToApply === undefined) {
    return;
  }

  if (isPartialPreset(presetToApply)) {
    await applyConfig({
      ...structuredClone(Config),
      ...presetToApply.config,
    });
  } else {
    await applyConfig(presetToApply.config);
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
  showSuccess("Preset applied", { durationMs: 2000 });
  saveFullConfigToLocalStorage();
}
function isPartialPreset(preset: SnapshotPreset): boolean {
  return preset.settingGroups !== undefined && preset.settingGroups !== null;
}

export async function getPreset(_id: string): Promise<Preset | undefined> {
  const snapshot = DB.getSnapshot();
  if (!snapshot) {
    return;
  }

  const preset = snapshot.presets?.find((preset) => preset._id === _id);

  if (preset === undefined) {
    showNotice("Preset not found");
    return;
  }
  return preset;
}
