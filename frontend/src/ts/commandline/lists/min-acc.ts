import * as UpdateConfig from "../../config";

const commands: MonkeyTypes.CommandsSubgroup = {
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
      exec: (input): void => {
        if (!input) return;
        UpdateConfig.setMinAccCustom(parseInt(input));
        UpdateConfig.setMinAcc("custom");
      },
    },
  ],
};
export default commands;
