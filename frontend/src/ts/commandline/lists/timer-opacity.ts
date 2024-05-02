import * as UpdateConfig from "../../config";

const subgroup: MonkeyTypes.CommandsSubgroup = {
  title: "Live stats opacity...",
  configKey: "timerOpacity",
  list: [
    {
      id: "setTimerOpacity.25",
      display: ".25",
      configValue: 0.25,
      alias: "timer",
      exec: (): void => {
        UpdateConfig.setTimerOpacity("0.25");
      },
    },
    {
      id: "setTimerOpacity.5",
      display: ".5",
      configValue: 0.5,
      alias: "timer",
      exec: (): void => {
        UpdateConfig.setTimerOpacity("0.5");
      },
    },
    {
      id: "setTimerOpacity.75",
      display: ".75",
      configValue: 0.75,
      alias: "timer",
      exec: (): void => {
        UpdateConfig.setTimerOpacity("0.75");
      },
    },
    {
      id: "setTimerOpacity1",
      display: "1",
      configValue: 1,
      alias: "timer",
      exec: (): void => {
        UpdateConfig.setTimerOpacity("1");
      },
    },
  ],
};

const commands: MonkeyTypes.Command[] = [
  {
    id: "changeTimerOpacity",
    display: "Live stats opacity...",
    icon: "fa-chart-pie",
    alias: "timer speed wpm burst acc",
    subgroup,
  },
];

export default commands;
