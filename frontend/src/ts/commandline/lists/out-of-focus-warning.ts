import * as UpdateConfig from "../../config";
import { Command, CommandsSubgroup } from "../types";

const subgroup: CommandsSubgroup = {
  title: "Colorful mode...",
  configKey: "showOutOfFocusWarning",
  list: [
    {
      id: "setShowOutOfFocusWarningOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setShowOutOfFocusWarning(false);
      },
    },
    {
      id: "setShowOutOfFocusWarningOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setShowOutOfFocusWarning(true);
      },
    },
  ],
};

const commands: Command[] = [
  {
    id: "changeOutOfFocusWarning",
    display: "Out of focus warning...",
    icon: "fa-exclamation",
    subgroup,
  },
];

export default commands;
