import * as UpdateConfig from "../../config";
import { Layouts } from "../../constants/layouts";
import * as TestLogic from "../../test/test-logic";
import { capitalizeFirstLetterOfEachWord } from "../../utils/strings";
import { Command, CommandsSubgroup } from "../types";

const subgroup: CommandsSubgroup = {
  title: "Change keymap layout...",
  configKey: "keymapLayout",
  list: [
    {
      id: "changeKeymapLayoutOverrideSync",
      display: "emulator sync",
      configValue: "overrideSync",
      alias: "default",
      exec: (): void => {
        UpdateConfig.setKeymapLayout("overrideSync");
        TestLogic.restart();
      },
    },
    ...Layouts.map((layout) => ({
      id: "changeKeymapLayout" + capitalizeFirstLetterOfEachWord(layout),
      display: layout.replace(/_/g, " "),
      configValue: layout,
      exec: (): void => {
        UpdateConfig.setKeymapLayout(layout);
        TestLogic.restart();
      },
    })),
  ],
};

const commands: Command[] = [
  {
    id: "changeKeymapLayout",
    display: "Keymap layout...",
    alias: "keyboard",
    icon: "fa-keyboard",
    subgroup,
  },
];

export default commands;
