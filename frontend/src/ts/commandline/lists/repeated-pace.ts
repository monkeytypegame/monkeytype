import * as UpdateConfig from "../../config";

const commands: MonkeyTypes.CommandsSubgroup = {
  title: "Repeated pace...",
  configKey: "repeatedPace",
  list: [
    {
      id: "setRepeatedPaceOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setRepeatedPace(false);
      },
    },
    {
      id: "setRepeatedPaceOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setRepeatedPace(true);
      },
    },
  ],
};

export default commands;
