import * as UpdateConfig from "../../config";
import { Command, CommandsSubgroup } from "../types";

const subgroup: CommandsSubgroup = {
  title: "Strict space...",
  configKey: "strictSpace",
  list: [
    {
      id: "setStrictSpaceOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setStrictSpace(false);
      },
    },
    {
      id: "setStrictSpaceOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setStrictSpace(true);
      },
    },
  ],
};

const commands: Command[] = [
  {
    id: "changeStrictSpace",
    display: "Strict space...",
    icon: "fa-minus",
    subgroup,
  },
];

export default commands;
