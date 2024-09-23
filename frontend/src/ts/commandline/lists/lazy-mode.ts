import * as UpdateConfig from "../../config";
import * as TestLogic from "../../test/test-logic";
import { Command, CommandsSubgroup } from "../types";

const subgroup: CommandsSubgroup = {
  title: "Lazy mode...",
  configKey: "lazyMode",
  list: [
    {
      id: "setLazyModeOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setLazyMode(false);
        TestLogic.restart();
      },
    },
    {
      id: "setLazyModeOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setLazyMode(true);
        TestLogic.restart();
      },
    },
  ],
};

const commands: Command[] = [
  {
    id: "changeLazyMode",
    display: "Lazy mode...",
    icon: "fa-couch",
    subgroup,
  },
];

export default commands;
