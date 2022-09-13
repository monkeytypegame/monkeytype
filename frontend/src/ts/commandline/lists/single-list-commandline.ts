import * as UpdateConfig from "../../config";

const commands: MonkeyTypes.CommandsGroup = {
  title: "Single list command line...",
  configKey: "singleListCommandLine",
  list: [
    {
      id: "singleListCommandLineManual",
      display: "manual",
      configValue: "manual",
      exec: (): void => {
        UpdateConfig.setSingleListCommandLine("manual");
      },
    },
    {
      id: "singleListCommandLineOn",
      display: "on",
      configValue: "on",
      exec: (): void => {
        UpdateConfig.setSingleListCommandLine("on");
      },
    },
  ],
};

export default commands;
