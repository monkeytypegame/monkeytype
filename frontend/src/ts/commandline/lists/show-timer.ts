import * as UpdateConfig from "../../config";

const subgroup: MonkeyTypes.CommandsSubgroup = {
  title: "Live progress...",
  configKey: "showTimerProgress",
  list: [
    {
      id: "setTimerProgressOff",
      display: "off",
      configValue: false,
      alias: "timer",
      exec: (): void => {
        UpdateConfig.setShowTimerProgress(false);
      },
    },
    {
      id: "setTimerProgressOn",
      display: "on",
      configValue: true,
      alias: "timer",
      exec: (): void => {
        UpdateConfig.setShowTimerProgress(true);
      },
    },
  ],
};

const commands: MonkeyTypes.Command[] = [
  {
    id: "changeShowTimer",
    display: "Live progress...",
    icon: "fa-chart-pie",
    subgroup,
  },
];

export default commands;
