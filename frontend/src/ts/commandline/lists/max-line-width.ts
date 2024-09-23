import Config, * as UpdateConfig from "../../config";
import { Command } from "../types";

const commands: Command[] = [
  {
    id: "changeMaxLineWidth",
    display: "Max line width...",
    icon: "fa-text-width",
    alias: "page",
    input: true,
    defaultValue: (): string => {
      return Config.maxLineWidth.toString();
    },
    exec: ({ input }): void => {
      if (input === undefined || input === "") return;
      UpdateConfig.setMaxLineWidth(parseFloat(input));
    },
  },
];
export default commands;
