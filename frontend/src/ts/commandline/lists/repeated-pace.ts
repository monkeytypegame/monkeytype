import * as UpdateConfig from "../../config";
import { Command, CommandsSubgroup } from "../types";

const subgroup: CommandsSubgroup = {
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

const commands: Command[] = [
  {
    id: "changeRepeatedPace",
    display: "Repeated pace...",
    icon: "fa-i-cursor",
    subgroup,
  },
];

export default commands;
