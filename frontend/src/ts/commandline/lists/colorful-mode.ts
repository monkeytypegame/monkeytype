import * as UpdateConfig from "../../config";
import { Command, CommandsSubgroup } from "../types";

const subgroup: CommandsSubgroup = {
  title: "Colorful mode...",
  configKey: "colorfulMode",
  list: [
    {
      id: "setColorfulModeOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setColorfulMode(false);
      },
    },
    {
      id: "setColorfulModeOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setColorfulMode(true);
      },
    },
  ],
};

const commands: Command[] = [
  {
    id: "changeColorfulMode",
    display: "Colorful mode...",
    icon: "fa-fill-drip",
    subgroup,
  },
];

export default commands;
