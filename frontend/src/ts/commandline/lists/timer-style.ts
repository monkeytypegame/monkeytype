import * as UpdateConfig from "../../config";

const subgroup: MonkeyTypes.CommandsSubgroup = {
  title: "Live progress style...",
  configKey: "timerStyle",
  list: [
    {
      id: "setTimerStyleBar",
      display: "bar",
      configValue: "bar",
      alias: "timer",
      exec: (): void => {
        UpdateConfig.setTimerStyle("bar");
      },
    },
    {
      id: "setTimerStyleText",
      display: "text",
      configValue: "text",
      alias: "timer",
      exec: (): void => {
        UpdateConfig.setTimerStyle("text");
      },
    },
    {
      id: "setTimerStyleMini",
      display: "mini",
      configValue: "mini",
      alias: "timer",
      exec: (): void => {
        UpdateConfig.setTimerStyle("mini");
      },
    },
  ],
};

const commands: MonkeyTypes.Command[] = [
  {
    id: "changeTimerStyle",
    display: "Live progress style...",
    icon: "fa-chart-pie",
    subgroup,
  },
];

export default commands;
