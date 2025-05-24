import * as UpdateConfig from "../../config";
import { Command, CommandsSubgroup } from "../types";

const subgroup: CommandsSubgroup = {
  title: "Ignore Caps Lock...",
  configKey: "ignoreCapsLock",
  list: [
    {
      id: "setIgnoreCapsLockOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setIgnoreCapsLock(false);
      },
    },
    {
      id: "setIgnoreCapsLockOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setIgnoreCapsLock(true);
      },
    },
  ],
};

const commands: Command[] = [
  {
    id: "changeIgnoreCapsLock",
    display: "Ignore Caps Lock...",
    icon: "fa-lock",
    subgroup,
  },
];

export default commands;
