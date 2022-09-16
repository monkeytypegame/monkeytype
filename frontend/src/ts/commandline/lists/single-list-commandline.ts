import * as UpdateConfig from "../../config";

const subgroup: MonkeyTypes.CommandsSubgroup = {
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

const commands: MonkeyTypes.Command[] = [
  {
    id: "singleListCommandLine",
    display: "Single list command line...",
    icon: "fa-list",
    subgroup,
  },
];

export default commands;
