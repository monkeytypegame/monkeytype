import Config, * as UpdateConfig from "../../config";
import { Command } from "../types";

const commands: Command[] = [
  {
    id: "changeTapeMargin",
    display: "Tape margin...",
    icon: "fa-tape",
    input: true,
    defaultValue: (): string => {
      return Config.tapeMargin.toString();
    },
    exec: ({ input }): void => {
      if (input === undefined || input === "") return;
      UpdateConfig.setTapeMargin(parseFloat(input));
    },
  },
];
export default commands;
