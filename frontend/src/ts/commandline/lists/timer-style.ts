import * as UpdateConfig from "../../config";

const subgroup: MonkeyTypes.CommandsSubgroup = {
  title: "Live progress style...",
  configKey: "timerStyle",
  list: [
    {
      id: "setTimerStyleOff",
      display: "off",
      configValue: "off",
      exec: (): void => {
        UpdateConfig.setTimerStyle("off");
      },
    },
    {
      id: "setTimerStyleBar",
      display: "bar",
      configValue: "bar",
      exec: (): void => {
        UpdateConfig.setTimerStyle("bar");
      },
    },
    {
      id: "setTimerStyleText",
      display: "text",
      configValue: "text",
      exec: (): void => {
        UpdateConfig.setTimerStyle("text");
      },
    },
    {
      id: "setTimerStyleMini",
      display: "mini",
      configValue: "mini",
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
    alias: "timer",
    subgroup,
  },
];

export default commands;
