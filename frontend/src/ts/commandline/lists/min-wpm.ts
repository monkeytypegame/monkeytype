import * as UpdateConfig from "../../config";

const commands: MonkeyTypes.CommandsSubgroup = {
  title: "Change min wpm mode...",
  configKey: "minWpm",
  list: [
    {
      id: "setMinWpmOff",
      display: "off",
      configValue: "off",
      exec: (): void => {
        UpdateConfig.setMinWpm("off");
      },
    },
    {
      id: "setMinWpmCustom",
      display: "custom...",
      configValue: "custom",
      input: true,
      exec: (input): void => {
        if (!input) return;
        UpdateConfig.setMinWpmCustomSpeed(parseInt(input));
        UpdateConfig.setMinWpm("custom");
      },
    },
  ],
};

export default commands;
