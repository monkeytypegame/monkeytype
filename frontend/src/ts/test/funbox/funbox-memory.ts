type SetFunction = (...params: any[]) => any;

let settingsMemory: {
  [key: string]: { value: any; setFunction: SetFunction };
} = {};

export function save(
  settingName: string,
  value: any,
  setFunction: SetFunction
): void {
  settingsMemory[settingName] ??= {
    value,
    setFunction,
  };
}

export function load(): void {
  for (const setting of Object.keys(settingsMemory)) {
    settingsMemory[setting].setFunction(settingsMemory[setting].value, true);
  }
  settingsMemory = {};
}
