import * as UpdateConfig from "../../config";

const subgroup: MonkeyTypes.CommandsSubgroup = {
  title: "Change min wpm mode...",
  configKey: "minWpm",
  list: [
    {
      id: "setMinWpmOff",
      display: "off",
      configValue: "off",
      exec: (): void => {
        UpdateConfig.setMinSpeed("off");
      },
    },
    {
      id: "setMinWpmCustom",
      display: "custom...",
      configValue: "custom",
      input: true,
      exec: (input): void => {
        if (!input) return;
        UpdateConfig.setMinSpeedCustom(parseInt(input));
        UpdateConfig.setMinSpeed("custom");
      },
    },
  ],
};

const commands: MonkeyTypes.Command[] = [
  {
    id: "changeMinWpm",
    display: "Minimum wpm...",
    alias: "minimum",
    icon: "fa-bomb",
    subgroup,
  },
];

export default commands;
