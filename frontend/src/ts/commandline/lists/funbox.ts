import * as Funbox from "../../test/funbox";
import * as TestLogic from "../../test/test-logic";

const commands: MonkeyTypes.CommandsSubgroup = {
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

function update(funboxes: MonkeyTypes.FunboxObject[]): void {
  funboxes.forEach((funbox) => {
    commands.list.push({
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
