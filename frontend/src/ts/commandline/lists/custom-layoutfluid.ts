import * as UpdateConfig from "../../config";
import { LayoutsList } from "../../constants/layouts";
import * as TestLogic from "../../test/test-logic";
import { capitalizeFirstLetterOfEachWord } from "../../utils/strings";
import { Command, CommandsSubgroup } from "../types";

const subgroup: CommandsSubgroup = {
  title: "Custom layoutfluid",
  configKey: "customLayoutfluid",
  list: LayoutsList.map((layout) => ({
    id: "changeCustomLayoutfluid" + capitalizeFirstLetterOfEachWord(layout),
    display: layout.replace(/_/g, " "),
    configValue: layout,
    configValueMode: "include",
    sticky: true,
    exec: (): void => {
      UpdateConfig.toggleCustomLayoutfluid(layout);
      TestLogic.restart();
    },
  })),
};

const commands: Command[] = [
  {
    id: "changeCustomLayoutfluid",
    display: "Custom layoutfluid...",
    icon: "fa-tint",
    subgroup,
  },
];

export default commands;
