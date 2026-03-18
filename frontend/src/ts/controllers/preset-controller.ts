import { Preset } from "@monkeytype/schemas/presets";

import { Config } from "../config/store";
import { applyConfig } from "../config/lifecycle";
import * as DB from "../db";
import {
  showNoticeNotification,
  showSuccessNotification,
} from "../states/notifications";
import * as TestLogic from "../test/test-logic";
import * as TagController from "./tag-controller";
import { SnapshotPreset } from "../constants/default-snapshot";
import { saveFullConfigToLocalStorage } from "../config/persistence";

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
  showSuccessNotification("Preset applied", { durationMs: 2000 });
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
    showNoticeNotification("Preset not found");
    return;
  }
  return preset;
}
