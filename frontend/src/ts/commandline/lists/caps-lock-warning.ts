import * as UpdateConfig from "../../config";

const commands: MonkeyTypes.CommandsSubgroup = {
  title: "Caps lock warning...",
  configKey: "capsLockWarning",
  list: [
    {
      id: "capsLockWarningOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setCapsLockWarning(true);
      },
    },
    {
      id: "capsLockWarningOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setCapsLockWarning(false);
      },
    },
  ],
};

export default commands;
