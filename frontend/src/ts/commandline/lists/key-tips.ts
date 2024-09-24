import * as UpdateConfig from "../../config";
import { Command, CommandsSubgroup } from "../types";

const subgroup: CommandsSubgroup = {
  title: "Key tips...",
  configKey: "showKeyTips",
  list: [
    {
      id: "setKeyTipsOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setKeyTips(false);
      },
    },
    {
      id: "setKeyTipsOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setKeyTips(true);
      },
    },
  ],
};

const commands: Command[] = [
  {
    id: "changeKeyTips",
    display: "Key tips...",
    icon: "fa-question",
    subgroup,
  },
];

export default commands;
