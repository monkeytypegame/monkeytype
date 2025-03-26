import * as UpdateConfig from "../../config";
import { Command, CommandsSubgroup } from "../types";

const subgroup: CommandsSubgroup = {
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

const commands: Command[] = [
  {
    id: "changeStartGraphsAtZero",
    display: "Start graphs at zero...",
    icon: "fa-chart-line",
    subgroup,
  },
];

export default commands;
