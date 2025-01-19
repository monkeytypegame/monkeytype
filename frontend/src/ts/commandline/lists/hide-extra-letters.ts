import * as UpdateConfig from "../../config";
import { Command, CommandsSubgroup } from "../types";

const subgroup: CommandsSubgroup = {
  title: "Hide extra letters...",
  configKey: "hideExtraLetters",
  list: [
    {
      id: "setHideExtraLettersOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setHideExtraLetters(false);
      },
    },
    {
      id: "setHideExtraLettersOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setHideExtraLetters(true);
      },
    },
  ],
};

const commands: Command[] = [
  {
    id: "changeHideExtraLetters",
    display: "Hide extra letters...",
    icon: "fa-eye-slash",
    subgroup,
  },
];

export default commands;
