import * as UpdateConfig from "../../config";
import { Command, CommandsSubgroup } from "../types";

const subgroup: CommandsSubgroup = {
  title: "Indicate typos...",
  configKey: "indicateTypos",
  list: [
    {
      id: "setIndicateTyposOff",
      display: "off",
      configValue: "off",
      exec: (): void => {
        UpdateConfig.setIndicateTypos("off");
      },
    },
    {
      id: "setIndicateTyposBelow",
      display: "below",
      configValue: "below",
      exec: (): void => {
        UpdateConfig.setIndicateTypos("below");
      },
    },
    {
      id: "setIndicateTyposReplace",
      display: "replace",
      configValue: "replace",
      exec: (): void => {
        UpdateConfig.setIndicateTypos("replace");
      },
    },
  ],
};

const commands: Command[] = [
  {
    id: "changeIndicateTypos",
    display: "Indicate typos...",
    icon: "fa-exclamation",
    subgroup,
  },
];

export default commands;
