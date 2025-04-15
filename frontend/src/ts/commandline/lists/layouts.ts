import * as UpdateConfig from "../../config";
import { LayoutsList } from "../../constants/layouts";
import * as TestLogic from "../../test/test-logic";
import { capitalizeFirstLetterOfEachWord } from "../../utils/strings";
import { Command, CommandsSubgroup } from "../types";

const subgroup: CommandsSubgroup = {
  title: "Layout emulator...",
  configKey: "layout",
  list: [{
    id: "changeLayoutDefault",
    display: "off",
    configValue: "default",
    exec: (): void => {
      UpdateConfig.setLayout("default");
      TestLogic.restart();
    },
  },
  ...LayoutsList.map(layout=> ({
    id: "changeLayout" + capitalizeFirstLetterOfEachWord(layout),
    display: layout.replace(/_/g, " "),
    configValue: layout,
    exec: (): void => {
      // UpdateConfig.setSavedLayout(layout);
      UpdateConfig.setLayout(layout);
      TestLogic.restart();
    },
  }))
   
  ],
};

const commands: Command[] = [
  {
    id: "changeLayout",
    display: "Layout emulator...",
    icon: "fa-keyboard",
    subgroup
  },
];

export default commands;
