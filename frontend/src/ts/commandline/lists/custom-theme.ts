import * as UpdateConfig from "../../config";
import { Command, CommandsSubgroup } from "../types";

const subgroup: CommandsSubgroup = {
  title: "Custom theme",
  configKey: "customTheme",
  list: [
    {
      id: "setCustomThemeOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setCustomTheme(false);
      },
    },
    {
      id: "setCustomThemeOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setCustomTheme(true);
      },
    },
  ],
};

const commands: Command[] = [
  {
    id: "setCustomTheme",
    display: "Custom theme...",
    icon: "fa-palette",
    subgroup,
  },
];

export default commands;
