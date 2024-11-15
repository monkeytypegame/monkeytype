import * as UpdateConfig from "../../config";
import { Command, CommandsSubgroup } from "../types";

const subgroup: CommandsSubgroup = {
  title: "Logo text...",
  configKey: "showLogoText",
  list: [
    {
      id: "setLogoTextOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setShowLogoText(false);
      },
    },
    {
      id: "setLogoTextOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setShowLogoText(true);
      },
    },
  ],
};

const commands: Command[] = [
  {
    id: "changeLogoText",
    display: "Show logo text...",
    icon: "fa-question",
    subgroup,
  },
];

export default commands;
