import * as Funbox from "../../test/funbox";
import * as TestLogic from "../../test/test-logic";

const subgroup: MonkeyTypes.CommandsSubgroup = {
  title: "Funbox...",
  configKey: "funbox",
  list: [
    {
      id: "changeFunboxNone",
      display: "none",
      configValue: "none",
      alias: "off",
      exec: (): void => {
        if (Funbox.setFunbox("none", null)) {
          TestLogic.restart();
        }
      },
    },
  ],
};

const commands: MonkeyTypes.Command[] = [
  {
    id: "changeFunbox",
    display: "Funbox...",
    alias: "fun box",
    icon: "fa-gamepad",
    subgroup,
  },
];

function update(funboxes: MonkeyTypes.FunboxObject[]): void {
  funboxes.forEach((funbox) => {
    subgroup.list.push({
      id: "changeFunbox" + funbox.name,
      display: funbox.name.replace(/_/g, " "),
      alias: funbox.alias,
      configValue: funbox.name,
      exec: (): void => {
        if (Funbox.setFunbox(funbox.name, funbox.type)) {
          TestLogic.restart();
        }
      },
    });
  });
}

export default commands;
export { update };
