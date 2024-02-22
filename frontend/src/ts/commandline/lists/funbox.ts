import * as Funbox from "../../test/funbox/funbox";
import * as TestLogic from "../../test/test-logic";
import * as ManualRestart from "../../test/manual-restart-tracker";
import Config from "../../config";

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
        if (Funbox.setFunbox("none")) {
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

function update(funboxes: MonkeyTypes.FunboxMetadata[]): void {
  subgroup.list = [];
  subgroup.list.push({
    id: "changeFunboxNone",
    display: "none",
    configValue: "none",
    alias: "off",
    exec: (): void => {
      ManualRestart.set();
      if (Funbox.setFunbox("none")) {
        TestLogic.restart();
      }
    },
  });
  funboxes.forEach((funbox) => {
    let dis;
    if (Config.funbox.includes(funbox.name)) {
      dis =
        '<i class="fas fa-fw fa-check"></i>' + funbox.name.replace(/_/g, " ");
    } else {
      dis = '<i class="fas fa-fw"></i>' + funbox.name.replace(/_/g, " ");
    }

    subgroup.list.push({
      id: "changeFunbox" + funbox.name,
      noIcon: true,
      display: dis,
      // visible: Funbox.isFunboxCompatible(funbox.name, funbox.type),
      sticky: true,
      alias: funbox.alias,
      configValue: funbox.name,
      exec: (): void => {
        Funbox.toggleFunbox(funbox.name);
        ManualRestart.set();
        TestLogic.restart();

        for (const funbox of funboxes) {
          // subgroup.list[i].visible = Funbox.isFunboxCompatible(funboxes[i].name, funboxes[i].type);

          let txt = funbox.name.replace(/_/g, " ");
          if (Config.funbox.includes(funbox.name)) {
            txt = '<i class="fas fa-fw fa-check"></i>' + txt;
          } else {
            txt = '<i class="fas fa-fw"></i>' + txt;
          }
          if ($("#commandLine").hasClass("allCommands")) {
            $(
              `#commandLine .suggestions .entry[command='changeFunbox${funbox.name}']`
            ).html(
              `<div class="icon"><i class="fas fa-fw fa-gamepad"></i></div><div>Funbox  > ` +
                txt
            );
          } else {
            $(
              `#commandLine .suggestions .entry[command='changeFunbox${funbox.name}']`
            ).html(txt);
          }
        }
        if (funboxes.length > 0) {
          const noneTxt =
            Config.funbox === "none"
              ? `<i class="fas fa-fw fa-check"></i>none`
              : `<i class="fas fa-fw"></i>none`;
          if ($("#commandLine").hasClass("allCommands")) {
            $(
              `#commandLine .suggestions .entry[command='changeFunboxNone']`
            ).html(
              `<div class="icon"><i class="fas fa-fw fa-gamepad"></i></div><div>Funbox  > ` +
                noneTxt
            );
          } else {
            $(
              `#commandLine .suggestions .entry[command='changeFunboxNone']`
            ).html(noneTxt);
          }
        }
      },
    });
  });
}

export default commands;
export { update };
