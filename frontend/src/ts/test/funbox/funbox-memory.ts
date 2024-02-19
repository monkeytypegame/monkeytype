type SetFunction<T> = (param: T, nosave?: boolean) => boolean;

type ValueAndSetFunction<T> = {
  value: T;
  setFunction: SetFunction<T>;
};

type SettingsMemory<T> = Record<string, ValueAndSetFunction<T>>;

let settingsMemory: SettingsMemory<SharedTypes.ConfigValue> = {};

export function save<T extends SharedTypes.ConfigValue>(
  settingName: string,
  value: T,
  setFunction: SetFunction<T>
): void {
  settingsMemory[settingName] ??= {
    value,
    setFunction: setFunction as SetFunction<SharedTypes.ConfigValue>,
  };
}

export function load(): void {
  Object.keys(settingsMemory).forEach((setting) => {
    const memory = settingsMemory[
      setting
    ] as ValueAndSetFunction<SharedTypes.ConfigValue>;
    memory.setFunction(memory.value, true);
  });
  settingsMemory = {};
}
