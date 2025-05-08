import * as Funbox from "../../test/funbox/funbox";
import * as TestLogic from "../../test/test-logic";
import * as ManualRestart from "../../test/manual-restart-tracker";
import { getAllFunboxes, checkCompatibility } from "@monkeytype/funbox";
import { Command, CommandsSubgroup } from "../types";
import { getActiveFunboxNames } from "../../test/funbox/list";

const list: Command[] = [
  {
    id: "changeFunboxNone",
    display: "none",
    configValue: "none",
    alias: "off",
    sticky: true,
    exec: (): void => {
      ManualRestart.set();
      if (Funbox.setFunbox([])) {
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
      const activeNames = getActiveFunboxNames();
      if (activeNames.includes(funbox.name)) return true;
      return checkCompatibility(activeNames, funbox.name);
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
