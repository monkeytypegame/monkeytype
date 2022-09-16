import * as UpdateConfig from "../../config";

const commands: MonkeyTypes.CommandsSubgroup = {
  title: "Colorful mode...",
  configKey: "showOutOfFocusWarning",
  list: [
    {
      id: "setShowOutOfFocusWarningOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setShowOutOfFocusWarning(false);
      },
    },
    {
      id: "setShowOutOfFocusWarningOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setShowOutOfFocusWarning(true);
      },
    },
  ],
};

export default commands;
