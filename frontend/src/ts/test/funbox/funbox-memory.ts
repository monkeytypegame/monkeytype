import { Config, ConfigKey, ConfigValue } from "@monkeytype/schemas/configs";

import { setConfig } from "../../config";

type SetFunction<T> = (
  param: T,
  nosave?: boolean,
  tribeOverride?: boolean,
) => boolean;

type ValueAndSetFunction<T> = {
  value: T;
  setFunction: SetFunction<T>;
};

type SettingsMemory<T> = Record<string, ValueAndSetFunction<T>>;

let settingsMemory: SettingsMemory<ConfigValue> = {};

export function save<T extends ConfigKey>(
  settingName: T,
  value: Config[T],
): void {
  settingsMemory[settingName] ??= {
    value,
    setFunction: (param, noSave?) =>
      setConfig(settingName, param as Config[T], {
        nosave: noSave ?? false,
      }),
  };
}

export function load(tribeOverride = false): void {
  Object.keys(settingsMemory).forEach((setting) => {
    const memory = settingsMemory[setting] as ValueAndSetFunction<ConfigValue>;
    memory.setFunction(memory.value, true, tribeOverride);
  });
  settingsMemory = {};
}
