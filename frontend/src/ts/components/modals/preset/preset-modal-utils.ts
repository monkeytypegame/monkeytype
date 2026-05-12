import {
  ConfigGroupName,
  ConfigGroupNameSchema,
  ConfigKey,
  Config as ConfigType,
} from "@monkeytype/schemas/configs";
import { PresetType } from "@monkeytype/schemas/presets";

import { __nonReactive as __nonReactiveTags } from "../../../collections/tags";
import { configMetadata } from "../../../config/metadata";
import { getConfigChanges as getConfigChangesFromConfig } from "../../../config/utils";
import { getDefaultConfig } from "../../../constants/default-config";

function getSettingGroup(configFieldName: ConfigKey): ConfigGroupName {
  return configMetadata[configFieldName].group;
}

function getPartialConfigChanges(
  configChanges: Partial<ConfigType>,
  checkboxes: Record<ConfigGroupName, boolean>,
): Partial<ConfigType> {
  const activeConfigChanges: Partial<ConfigType> = {};
  const defaultConfig = getDefaultConfig();

  (Object.keys(defaultConfig) as ConfigKey[])
    .filter((settingName) => checkboxes[getSettingGroup(settingName)])
    .forEach((settingName) => {
      const newValue = configChanges[settingName] ?? defaultConfig[settingName];
      // @ts-expect-error cant figure this one out, but it works
      activeConfigChanges[settingName] = newValue;
    });
  return activeConfigChanges;
}

export function getActiveSettingGroups(
  checkboxes: Record<ConfigGroupName, boolean>,
): ConfigGroupName[] {
  return (Object.entries(checkboxes) as [ConfigGroupName, boolean][])
    .filter(([, value]) => value)
    .map(([key]) => key);
}

export function getConfigChanges(
  presetType: PresetType,
  checkboxes: Record<ConfigGroupName, boolean>,
): Partial<ConfigType> {
  const activeConfigChanges =
    presetType === "partial"
      ? getPartialConfigChanges(getConfigChangesFromConfig(), checkboxes)
      : getConfigChangesFromConfig();
  const activeTagIds: string[] = __nonReactiveTags
    .getActiveTags()
    .map((tag) => tag._id);

  const setTags = presetType === "full" || checkboxes.behavior;
  return {
    ...activeConfigChanges,
    ...(setTags && { tags: activeTagIds }),
  };
}

export function getCheckboxes(
  value: Record<ConfigGroupName, boolean>,
): Record<ConfigGroupName, boolean> {
  return Object.fromEntries(
    ConfigGroupNameSchema.options.map((key) => [key, value[key]]),
  ) as Record<ConfigGroupName, boolean>;
}
