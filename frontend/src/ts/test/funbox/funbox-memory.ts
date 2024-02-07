type SetFunction<T> = (param: T, nosave?: boolean) => boolean;

type ValueAndSetFunction<T> = {
  value: T;
  setFunction: SetFunction<T>;
};

type SettingsMemory<T> = {
  [key: string]: ValueAndSetFunction<T>;
};

let settingsMemory: SettingsMemory<MonkeyTypes.ConfigValue> = {};

export function save<T extends MonkeyTypes.ConfigValue>(
  settingName: string,
  value: T,
  setFunction: SetFunction<T>
): void {
  settingsMemory[settingName] ??= {
    value,
    setFunction: setFunction as SetFunction<MonkeyTypes.ConfigValue>,
  };
}

export function load(): void {
  Object.keys(settingsMemory).forEach((setting) => {
    const memory = settingsMemory[
      setting
    ] as ValueAndSetFunction<MonkeyTypes.ConfigValue>;
    memory.setFunction(memory.value, true);
  });
  settingsMemory = {};
}
