import * as UpdateConfig from "../../config";
import { Command, CommandsSubgroup } from "../types";

const subgroup: CommandsSubgroup = {
  title: "Smooth line scroll...",
  configKey: "smoothLineScroll",
  list: [
    {
      id: "setSmoothLineScrollOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setSmoothLineScroll(false);
      },
    },
    {
      id: "setSmoothLineScrollOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setSmoothLineScroll(true);
      },
    },
  ],
};

const commands: Command[] = [
  {
    id: "changeSmoothLineScroll",
    display: "Smooth line scroll...",
    icon: "fa-align-left",
    subgroup,
  },
];

export default commands;
