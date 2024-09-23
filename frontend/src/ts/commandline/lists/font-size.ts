import Config, * as UpdateConfig from "../../config";
import { Command } from "../types";

const commands: Command[] = [
  {
    id: "changeFontSize",
    display: "Font size...",
    icon: "fa-font",
    input: true,
    defaultValue: (): string => {
      return Config.fontSize.toString();
    },
    exec: ({ input }): void => {
      if (input === undefined || input === "") return;
      UpdateConfig.setFontSize(parseFloat(input));
    },
  },
];
export default commands;
