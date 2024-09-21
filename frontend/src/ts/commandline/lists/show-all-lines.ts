import * as UpdateConfig from "../../config";
import { Command, CommandsSubgroup } from "../types";

const subgroup: CommandsSubgroup = {
  title: "Show all lines...",
  configKey: "showAllLines",
  list: [
    {
      id: "setShowAllLinesOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setShowAllLines(false);
      },
    },
    {
      id: "setShowAllLinesOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setShowAllLines(true);
      },
    },
  ],
};

const commands: Command[] = [
  {
    id: "changeShowAllLines",
    display: "Show all lines...",
    icon: "fa-align-left",
    subgroup,
  },
];

export default commands;
