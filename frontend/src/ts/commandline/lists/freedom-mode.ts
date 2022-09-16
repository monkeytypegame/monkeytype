import * as UpdateConfig from "../../config";

const commands: MonkeyTypes.CommandsSubgroup = {
  title: "Freedom mode...",
  configKey: "freedomMode",
  list: [
    {
      id: "setfreedomModeOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setFreedomMode(false);
      },
    },
    {
      id: "setfreedomModeOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setFreedomMode(true);
      },
    },
  ],
};

export default commands;
