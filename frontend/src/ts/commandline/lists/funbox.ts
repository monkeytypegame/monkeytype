import * as Funbox from "../../test/funbox/funbox";
import * as TestLogic from "../../test/test-logic";
import * as ManualRestart from "../../test/manual-restart-tracker";
import Config from "../../config";
import { areFunboxesCompatible } from "../../test/funbox/funbox-validation";
import { FunboxMetadata } from "../../utils/json-data";
import { Command, CommandsSubgroup } from "../types";

const subgroup: CommandsSubgroup = {
  title: "Funbox...",
  configKey: "funbox",
  list: [
    {
      id: "changeFunboxNone",
      display: "none",
      configValue: "none",
      alias: "off",
      exec: (): void => {
        if (Funbox.setFunbox("none")) {
          TestLogic.restart();
        }
      },
    },
  ],
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

function update(funboxes: FunboxMetadata[]): void {
  subgroup.list = [];
  subgroup.list.push({
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
  });
  for (const funbox of funboxes) {
    subgroup.list.push({
      id: "changeFunbox" + funbox.name,
      display: funbox.name.replace(/_/g, " "),
      available: () => {
        if (Config.funbox.split("#").includes(funbox.name)) return true;
        return areFunboxesCompatible(Config.funbox, funbox.name);
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
}

export default commands;
export { update };
