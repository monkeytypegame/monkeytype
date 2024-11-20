import * as Funbox from "../../test/funbox/funbox";
import * as TestLogic from "../../test/test-logic";
import * as ManualRestart from "../../test/manual-restart-tracker";
import Config from "../../config";
import { getList as getAllFunboxes } from "@monkeytype/funbox/list";
import { Command, CommandsSubgroup } from "../types";
import { checkCompatibility } from "@monkeytype/funbox/validation";
import { stringToFunboxNames } from "@monkeytype/funbox/util";

const list: Command[] = [
  {
    id: "changeFunboxNone",
    display: "none",
    configValue: "none",
    alias: "off",
    sticky: true,
    exec: (): void => {
      ManualRestart.set();
      if (Funbox.setFunbox("none")) {
        TestLogic.restart();
      }
    },
  },
];

for (const funbox of getAllFunboxes()) {
  list.push({
    id: "changeFunbox" + funbox.name,
    display: funbox.name.replace(/_/g, " "),
    available: () => {
      const configFunboxes = stringToFunboxNames(Config.funbox);
      if (configFunboxes.includes(funbox.name)) return true;
      return checkCompatibility(configFunboxes, funbox.name);
    },
    sticky: true,
    alias: funbox.alias,
    configValue: funbox.name,
    configValueMode: "include",
    exec: (): void => {
      Funbox.toggleFunbox(funbox.name);
      ManualRestart.set();
      TestLogic.restart();
    },
  });
}

const subgroup: CommandsSubgroup = {
  title: "Funbox...",
  configKey: "funbox",
  list,
};

const commands: Command[] = [
  {
    id: "changeFunbox",
    display: "Funbox...",
    alias: "fun box",
    icon: "fa-gamepad",
    subgroup,
  },
];

export default commands;
