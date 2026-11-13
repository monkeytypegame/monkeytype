import { getUserData } from "../queries/user";
import { Config } from "../config/store";
import { applyConfig } from "../config/lifecycle";
import { showSuccessNotification } from "../states/notifications";
import * as TestLogic from "../test/test-logic";
import { setActiveTags } from "../queries/tags";
import { saveFullConfigToLocalStorage } from "../config/persistence";
import { __nonReactive, type PresetItem } from "../collections/presets";

export async function apply(_id: string): Promise<void> {
  const userData = getUserData();
  if (!userData) return;

  const presetToApply = __nonReactive.getPreset(_id);
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
    setActiveTags(presetToApply.config.tags ?? []);
  }
  void TestLogic.restartTest();
  showSuccessNotification("Preset applied", { durationMs: 2000 });
  saveFullConfigToLocalStorage();
}

function isPartialPreset(preset: PresetItem): boolean {
  return preset.settingGroups !== undefined && preset.settingGroups !== null;
}
