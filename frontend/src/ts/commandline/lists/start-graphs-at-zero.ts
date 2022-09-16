import * as UpdateConfig from "../../config";

const subgroup: MonkeyTypes.CommandsSubgroup = {
  title: "Start graphs at zero...",
  configKey: "startGraphsAtZero",
  list: [
    {
      id: "setStartGraphsAtZeroOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setStartGraphsAtZero(false);
      },
    },
    {
      id: "setStartGraphsAtZeroOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setStartGraphsAtZero(true);
      },
    },
  ],
};

const commands: MonkeyTypes.Command[] = [
  {
    id: "changeStartGraphsAtZero",
    display: "Start graphs at zero...",
    icon: "fa-chart-line",
    subgroup,
  },
];

export default commands;
