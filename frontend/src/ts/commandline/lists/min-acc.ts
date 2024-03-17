import * as UpdateConfig from "../../config";

const subgroup: MonkeyTypes.CommandsSubgroup = {
  title: "Change min accuracy mode...",
  configKey: "minAcc",
  list: [
    {
      id: "setMinAccOff",
      display: "off",
      configValue: "off",
      exec: (): void => {
        UpdateConfig.setMinAcc("off");
      },
    },
    {
      id: "setMinAccCustom",
      display: "custom...",
      configValue: "custom",
      input: true,
      exec: ({ input }): void => {
        if (input === undefined || input === "") return;
        UpdateConfig.setMinAccCustom(parseInt(input));
        UpdateConfig.setMinAcc("custom");
      },
    },
  ],
};

const commands: MonkeyTypes.Command[] = [
  {
    id: "changeMinAcc",
    display: "Minimum accuracy...",
    alias: "minimum",
    icon: "fa-bomb",
    subgroup,
  },
];

export default commands;
