import * as UpdateConfig from "../../config";
import { Command, CommandsSubgroup } from "../types";

const subgroup: CommandsSubgroup = {
  title: "Code indentation deletion...",
  configKey: "codeIndentationDeletion",
  list: [
    {
      id: "changeCodeIndentationDeletionBackspace",
      display: "Backspace",
      configValue: "backspace",
      exec: (): void => {
        UpdateConfig.setCodeIndentationDeletion("backspace");
      },
    },
    {
      id: "changeCodeIndentationDeletionLine",
      display: "Line",
      configValue: "line",
      exec: (): void => {
        UpdateConfig.setCodeIndentationDeletion("line");
      },
    },
  ],
};

const commands: Command[] = [
  {
    id: "changeCodeIndentationDeletion",
    display: "Code indentation deletion...",
    icon: "fa-code",
    subgroup,
  },
];

export default commands;
