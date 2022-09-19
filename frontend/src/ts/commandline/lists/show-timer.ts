import * as UpdateConfig from "../../config";

const subgroup: MonkeyTypes.CommandsSubgroup = {
  title: "Timer/progress...",
  configKey: "showTimerProgress",
  list: [
    {
      id: "setTimerProgressOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setShowTimerProgress(false);
      },
    },
    {
      id: "setTimerProgressOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setShowTimerProgress(true);
      },
    },
  ],
};

const commands: MonkeyTypes.Command[] = [
  {
    id: "changeShowTimer",
    display: "Timer/progress...",
    icon: "fa-clock",
    subgroup,
  },
];

export default commands;
