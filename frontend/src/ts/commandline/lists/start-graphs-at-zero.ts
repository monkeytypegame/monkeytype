import * as UpdateConfig from "../../config";

const commands: MonkeyTypes.CommandsSubgroup = {
  title: "Start graphs at zero...",
  configKey: "startGraphsAtZero",
  list: [
    {
      id: "setStartGraphsAtZeroOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setStartGraphsAtZero(false);
      },
    },
    {
      id: "setStartGraphsAtZeroOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setStartGraphsAtZero(true);
      },
    },
  ],
};

export default commands;
