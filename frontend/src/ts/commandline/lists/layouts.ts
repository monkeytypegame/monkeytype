import * as UpdateConfig from "../../config";
import * as TestLogic from "../../test/test-logic";
import { capitalizeFirstLetterOfEachWord } from "../../utils/strings";

const subgroup: MonkeyTypes.CommandsSubgroup = {
  title: "Layout emulator...",
  configKey: "layout",
  list: [
    {
      id: "couldnotload",
      display: "Could not load the layouts list :(",
    },
  ],
};

const commands: MonkeyTypes.Command[] = [
  {
    id: "changeLayout",
    display: "Layout emulator...",
    icon: "fa-keyboard",
    subgroup
  },
];

function update(layouts: MonkeyTypes.Layouts): void {
  subgroup.list = [];
  subgroup.list.push({
    id: "changeLayoutDefault",
    display: "off",
    configValue: "default",
    exec: (): void => {
      UpdateConfig.setLayout("default");
      TestLogic.restart();
    },
  });
  Object.keys(layouts).forEach((layout) => {
    subgroup.list.push({
      id: "changeLayout" + capitalizeFirstLetterOfEachWord(layout),
      display: layout === "default" ? "off" : layout.replace(/_/g, " "),
      configValue: layout,
      exec: (): void => {
        // UpdateConfig.setSavedLayout(layout);
        UpdateConfig.setLayout(layout);
        TestLogic.restart();
      },
    });
  });
}


export default commands;
export { update };
