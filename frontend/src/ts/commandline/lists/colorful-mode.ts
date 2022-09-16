import * as UpdateConfig from "../../config";

const commands: MonkeyTypes.CommandsSubgroup = {
  title: "Colorful mode...",
  configKey: "colorfulMode",
  list: [
    {
      id: "setColorfulModeOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setColorfulMode(false);
      },
    },
    {
      id: "setColorfulModeOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setColorfulMode(true);
      },
    },
  ],
};

export default commands;
