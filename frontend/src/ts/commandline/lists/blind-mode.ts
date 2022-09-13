import * as UpdateConfig from "../../config";

const commands: MonkeyTypes.CommandsGroup = {
  title: "Blind mode...",
  configKey: "blindMode",
  list: [
    {
      id: "setBlindModeOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setBlindMode(false);
      },
    },
    {
      id: "setBlindModeOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setBlindMode(true);
      },
    },
  ],
};

export default commands;
