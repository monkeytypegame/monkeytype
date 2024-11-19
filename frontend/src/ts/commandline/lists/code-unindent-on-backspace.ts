import * as UpdateConfig from "../../config";
import { Command, CommandsSubgroup } from "../types";

const subgroup: CommandsSubgroup = {
  title: "Code unindent on backspace...",
  configKey: "codeUnindentOnBackspace",
  list: [
    {
      id: "setCodeUnindentOnBackspaceOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setCodeUnindentOnBackspace(false);
      },
    },
    {
      id: "changeCodeUnindentOnBackspaceOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setCodeUnindentOnBackspace(true);
      },
    },
  ],
};

const commands: Command[] = [
  {
    id: "changeCodeUnindentOnBackspace",
    display: "Code unindent on backspace...",
    icon: "fa-code",
    subgroup,
  },
];

export default commands;
