type SetFunction<T> = (
  param: T,
  nosave?: boolean,
  tribeOverride?: boolean
) => boolean;

type SettingsMemory<T> = {
  [key: string]: {
    value: T;
    setFunction: SetFunction<T>;
  };
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

export function load(tribeOverride = false): void {
  Object.keys(settingsMemory).forEach((setting) => {
    settingsMemory[setting].setFunction(
      settingsMemory[setting].value,
      true,
      tribeOverride
    );
  });
  settingsMemory = {};
}
