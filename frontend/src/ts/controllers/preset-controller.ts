import { getUserData } from "../queries/user";
import { Config } from "../config/store";
import { applyConfig } from "../config/lifecycle";
import { showSuccessNotification } from "../states/notifications";
import * as TestLogic from "../test/test-logic";
import { setActiveTags } from "../queries/tags";
import { saveFullConfigToLocalStorage } from "../config/persistence";
import { type Preset as PresetSchema } from "@monkeytype/schemas/presets";
import { getPreset, type Preset } from "../queries/presets";

export async function apply(_id: string): Promise<void> {
  const userData = getUserData();
  if (!userData) return;

  const presetToApply = getPreset(_id);
  if (presetToApply === undefined) {
    return;
  }

  // a mutable copy: the cached preset is read-only
  const config = structuredClone(
    presetToApply.config,
  ) as PresetSchema["config"];
  if (isPartialPreset(presetToApply)) {
    await applyConfig({
      ...structuredClone(Config),
      ...config,
    });
  } else {
    await applyConfig(config);
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

function isPartialPreset(preset: Preset): boolean {
  return preset.settingGroups !== undefined && preset.settingGroups !== null;
}
