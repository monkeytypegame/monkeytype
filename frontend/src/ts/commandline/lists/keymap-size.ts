import Config, * as UpdateConfig from "../../config";
import { Command } from "../types";

const commands: Command[] = [
  {
    id: "changeKeymapSize",
    display: "Keymap size...",
    icon: "fa-keyboard",
    alias: "keyboard",
    input: true,
    defaultValue: (): string => {
      return Config.keymapSize.toString();
    },
    exec: ({ input }): void => {
      if (input === undefined || input === "") return;
      UpdateConfig.setKeymapSize(parseFloat(input));
    },
  },
];
export default commands;
