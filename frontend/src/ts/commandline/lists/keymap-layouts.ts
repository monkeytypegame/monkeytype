import * as UpdateConfig from "../../config";
import * as TestLogic from "../../test/test-logic";
import { LayoutsList } from "../../utils/json-data";
import { capitalizeFirstLetterOfEachWord } from "../../utils/strings";
import { Command, CommandsSubgroup } from "../types";

const subgroup: CommandsSubgroup = {
  title: "Change keymap layout...",
  configKey: "keymapLayout",
  list: [
    {
      id: "couldnotload",
      display: "Could not load the layouts list :(",
    },
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

function update(layouts: LayoutsList): void {
  subgroup.list = [];
  subgroup.list.push({
    id: "changeKeymapLayoutOverrideSync",
    display: "emulator sync",
    configValue: "overrideSync",
    alias: "default",
    exec: (): void => {
      UpdateConfig.setKeymapLayout("overrideSync");
      TestLogic.restart();
    },
  });
  Object.keys(layouts).forEach((layout) => {
    if (layout.toString() != "default") {
      subgroup.list.push({
        id: "changeKeymapLayout" + capitalizeFirstLetterOfEachWord(layout),
        display: layout.replace(/_/g, " "),
        configValue: layout,
        exec: (): void => {
          UpdateConfig.setKeymapLayout(layout);
          TestLogic.restart();
        },
      });
    }
  });
}

export default commands;
export { update };
