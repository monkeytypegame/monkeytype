import * as UpdateConfig from "../../config";

const subgroup: MonkeyTypes.CommandsSubgroup = {
  title: "Change min burst mode...",
  configKey: "minBurst",
  list: [
    {
      id: "setMinBurstOff",
      display: "off",
      configValue: "off",
      exec: (): void => {
        UpdateConfig.setMinBurst("off");
      },
    },
    {
      id: "setMinBurstFixed",
      display: "fixed...",
      configValue: "fixed",
      input: true,
      exec: (input): void => {
        if (!input) return;
        UpdateConfig.setMinBurst("fixed");
        UpdateConfig.setMinBurstCustomSpeed(parseInt(input));
      },
    },
    {
      id: "setMinBurstFlex",
      display: "flex...",
      configValue: "flex",
      input: true,
      exec: (input): void => {
        if (!input) return;
        UpdateConfig.setMinBurst("flex");
        UpdateConfig.setMinBurstCustomSpeed(parseInt(input));
      },
    },
  ],
};

const commands: MonkeyTypes.Command[] = [
  {
    id: "changeMinBurst",
    display: "Minimum burst...",
    alias: "minimum",
    icon: "fa-bomb",
    subgroup,
  },
];

export default commands;
