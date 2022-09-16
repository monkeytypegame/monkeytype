import * as UpdateConfig from "../../config";
import * as TestLogic from "../../test/test-logic";
import { capitalizeFirstLetterOfEachWord } from "../../utils/misc";

export const commands: MonkeyTypes.CommandsSubgroup = {
  title: "Change keymap layout...",
  configKey: "keymapLayout",
  list: [
    {
      id: "couldnotload",
      display: "Could not load the layouts list :(",
    },
  ],
};

function update(layouts: MonkeyTypes.Layouts): void {
  commands.list = [];
  commands.list.push({
    id: "changeKeymapLayoutOverrideSync",
    display: "emulator sync",
    configValue: "overrideSync",
    exec: (): void => {
      UpdateConfig.setKeymapLayout("overrideSync");
      TestLogic.restart();
    },
  });
  Object.keys(layouts).forEach((layout) => {
    if (layout.toString() != "default") {
      commands.list.push({
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
