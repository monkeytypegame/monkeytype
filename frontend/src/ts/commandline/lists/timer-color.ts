import * as UpdateConfig from "../../config";

const subgroup: MonkeyTypes.CommandsSubgroup = {
  title: "Live stats color...",
  configKey: "timerColor",
  list: [
    {
      id: "setTimerColorBlack",
      display: "black",
      configValue: "black",
      alias: "timer",
      exec: (): void => {
        UpdateConfig.setTimerColor("black");
      },
    },
    {
      id: "setTimerColorSub",
      display: "sub",
      configValue: "sub",
      alias: "timer",
      exec: (): void => {
        UpdateConfig.setTimerColor("sub");
      },
    },
    {
      id: "setTimerColorText",
      display: "text",
      configValue: "text",
      alias: "timer",
      exec: (): void => {
        UpdateConfig.setTimerColor("text");
      },
    },
    {
      id: "setTimerColorMain",
      display: "main",
      configValue: "main",
      alias: "timer",
      exec: (): void => {
        UpdateConfig.setTimerColor("main");
      },
    },
  ],
};

const commands: MonkeyTypes.Command[] = [
  {
    id: "changeTimerColor",
    display: "Live stats color...",
    icon: "fa-chart-pie",
    alias: "timer speed wpm burst acc",
    subgroup,
  },
];

export default commands;
