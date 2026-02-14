import Config, { setConfig } from "../../config";
import { Command, CommandsSubgroup } from "../types";

const subgroup: CommandsSubgroup = {
  title: "Result saving...",
  list: [
    {
      id: "setResultSavingOff",
      display: "off",
      alias: "disabled incognito",
      exec: (): void => {
        setConfig("resultSavingEnabled", false);
      },
      active: () => !Config.resultSavingEnabled,
    },
    {
      id: "setResultSavingOn",
      display: "on",
      alias: "enabled incognito",
      exec: (): void => {
        setConfig("resultSavingEnabled", true);
      },
      active: () => Config.resultSavingEnabled,
    },
  ],
};

const commands: Command[] = [
  {
    id: "setResultSaving",
    display: "Result saving...",
    icon: "fa-save",
    alias: "results practice",
    subgroup,
  },
];

export default commands;
