import * as UpdateConfig from "../../config";
import { Command, CommandsSubgroup } from "../types";

const subgroup: CommandsSubgroup = {
  title: "Flip test colors...",
  configKey: "flipTestColors",
  list: [
    {
      id: "setFlipTestColorsOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setFlipTestColors(false);
      },
    },
    {
      id: "setFlipTestColorsOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setFlipTestColors(true);
      },
    },
  ],
};

const commands: Command[] = [
  {
    id: "changeFlipTestColors",
    display: "Flip test colors...",
    icon: "fa-adjust",
    subgroup,
  },
];

export default commands;
