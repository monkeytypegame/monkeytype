import * as UpdateConfig from "../../config";
import { Command, CommandsSubgroup } from "../types";

const subgroup: CommandsSubgroup = {
  title: "Keymap legend style...",
  configKey: "keymapLegendStyle",
  list: [
    {
      id: "setKeymapLegendStyleLowercase",
      display: "lowercase",
      configValue: "lowercase",
      exec: (): void => {
        UpdateConfig.setKeymapLegendStyle("lowercase");
      },
    },
    {
      id: "setKeymapLegendStyleUppercase",
      display: "uppercase",
      configValue: "uppercase",
      exec: (): void => {
        UpdateConfig.setKeymapLegendStyle("uppercase");
      },
    },
    {
      id: "setKeymapLegendStyleBlank",
      display: "blank",
      configValue: "blank",
      exec: (): void => {
        UpdateConfig.setKeymapLegendStyle("blank");
      },
    },
    {
      id: "setKeymapLegendStyleDynamic",
      display: "dynamic",
      configValue: "dynamic",
      exec: (): void => {
        UpdateConfig.setKeymapLegendStyle("dynamic");
      },
    },
  ],
};

const commands: Command[] = [
  {
    id: "changeKeymapLegendStyle",
    display: "Keymap legend style...",
    alias: "keyboard",
    icon: "fa-keyboard",
    subgroup,
  },
];

export default commands;
