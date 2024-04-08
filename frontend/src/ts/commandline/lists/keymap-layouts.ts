import * as UpdateConfig from "../../config";
import * as TestLogic from "../../test/test-logic";
import { capitalizeFirstLetterOfEachWord } from "../../utils/strings";

const subgroup: MonkeyTypes.CommandsSubgroup = {
  title: "Change keymap layout...",
  configKey: "keymapLayout",
  list: [
    {
      id: "couldnotload",
      display: "Could not load the layouts list :(",
    },
  ],
};

const commands: MonkeyTypes.Command[] = [
  {
    id: "changeKeymapLayout",
    display: "Keymap layout...",
    alias: "keyboard",
    icon: "fa-keyboard",
    subgroup,
  },
];

function update(layouts: MonkeyTypes.Layouts): void {
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
