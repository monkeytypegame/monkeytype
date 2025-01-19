import * as UpdateConfig from "../../config";
import { Command, CommandsSubgroup } from "../types";

const subgroup: CommandsSubgroup = {
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

const commands: Command[] = [
  {
    id: "singleListCommandLine",
    display: "Single list command line...",
    icon: "fa-list",
    subgroup,
  },
];

export default commands;
