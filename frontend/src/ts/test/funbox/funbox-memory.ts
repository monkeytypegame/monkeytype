type SetFunction<T> = (param: T, nosave?: boolean) => boolean;

type ValueAndSetFunction<T> = {
  value: T;
  setFunction: SetFunction<T>;
};

type SettingsMemory<T> = {
  [key: string]: ValueAndSetFunction<T>;
};

let settingsMemory: SettingsMemory<MonkeyTypes.ConfigValues> = {};

export function save<T extends MonkeyTypes.ConfigValues>(
  settingName: string,
  value: T,
  setFunction: SetFunction<T>
): void {
  settingsMemory[settingName] ??= {
    value,
    setFunction: setFunction as SetFunction<MonkeyTypes.ConfigValues>,
  };
}

export function load(): void {
  Object.keys(settingsMemory).forEach((setting) => {
    const memory = settingsMemory[
      setting
    ] as ValueAndSetFunction<MonkeyTypes.ConfigValues>;
    memory.setFunction(memory.value, true);
  });
  settingsMemory = {};
}
