import * as UpdateConfig from "../../config";

const commands: MonkeyTypes.CommandsSubgroup = {
  title: "Always show CPM...",
  configKey: "alwaysShowCPM",
  list: [
    {
      id: "setAlwaysShowCPMOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setAlwaysShowCPM(false);
      },
    },
    {
      id: "setAlwaysShowCPMOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setAlwaysShowCPM(true);
      },
    },
  ],
};

export default commands;
