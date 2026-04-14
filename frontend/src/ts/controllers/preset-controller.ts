import { Config } from "../config/store";
import { applyConfig } from "../config/lifecycle";
import * as DB from "../db";
import { showSuccessNotification } from "../states/notifications";
import * as TestLogic from "../test/test-logic";
import * as TagController from "./tag-controller";
import { saveFullConfigToLocalStorage } from "../config/persistence";
import {
  getPreset as getPresetFromCollection,
  PresetItem,
} from "../collections/presets";

export async function apply(_id: string): Promise<void> {
  const snapshot = DB.getSnapshot();
  if (!snapshot) return;

  const presetToApply = getPresetFromCollection(_id);
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
  showSuccessNotification("Preset applied", { durationMs: 2000 });
  saveFullConfigToLocalStorage();
}

function isPartialPreset(preset: PresetItem): boolean {
  return preset.settingGroups !== undefined && preset.settingGroups !== null;
}
