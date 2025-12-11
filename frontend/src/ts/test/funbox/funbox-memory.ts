import { ConfigKey, ConfigValue } from "@monkeytype/schemas/configs";
import { setConfig } from "../../config";

type SetFunction<T> = (param: T, nosave?: boolean) => boolean;

type ValueAndSetFunction<T> = {
  value: T;
  setFunction: SetFunction<T>;
};

type SettingsMemory<T> = Record<string, ValueAndSetFunction<T>>;

let settingsMemory: SettingsMemory<ConfigValue> = {};

export function save<T extends ConfigValue>(
  settingName: ConfigKey,
  value: T,
  setFunction?: SetFunction<T>,
): void {
  //TODO remove setFunction parameter after removing all helper functions in config
  setFunction ??= (param, noSave?) => setConfig(settingName, param, noSave);
  settingsMemory[settingName] ??= {
    value,
    setFunction: setFunction as SetFunction<ConfigValue>,
  };
}

export function load(): void {
  Object.keys(settingsMemory).forEach((setting) => {
    const memory = settingsMemory[setting] as ValueAndSetFunction<ConfigValue>;
    memory.setFunction(memory.value, true);
  });
  settingsMemory = {};
}
