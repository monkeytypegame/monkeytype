import * as UpdateConfig from "../../config";

const commands: MonkeyTypes.CommandsGroup = {
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

export default commands;
