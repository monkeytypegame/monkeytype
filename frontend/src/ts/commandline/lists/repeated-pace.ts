import * as UpdateConfig from "../../config";

const subgroup: MonkeyTypes.CommandsSubgroup = {
  title: "Repeated pace...",
  configKey: "repeatedPace",
  list: [
    {
      id: "setRepeatedPaceOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setRepeatedPace(false);
      },
    },
    {
      id: "setRepeatedPaceOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setRepeatedPace(true);
      },
    },
  ],
};

const commands: MonkeyTypes.Command[] = [
  {
    id: "changeRepeatedPace",
    display: "Repeated pace...",
    icon: "fa-i-cursor",
    subgroup,
  },
];

export default commands;
