import * as UpdateConfig from "../../config";

const subgroup: MonkeyTypes.CommandsSubgroup = {
  title: "Change min speed mode...",
  configKey: "minSpeed",
  list: [
    {
      id: "setMinSpeedOff",
      display: "off",
      configValue: "off",
      exec: (): void => {
        UpdateConfig.setMinSpeed("off");
      },
    },
    {
      id: "setMinSpeedCustom",
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
    id: "changeMinSpeed",
    display: "Minimum speed...",
    alias: "minimum",
    icon: "fa-bomb",
    subgroup,
  },
];

export default commands;
