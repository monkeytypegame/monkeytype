import * as UpdateConfig from "../../config";

export const commands: MonkeyTypes.CommandsSubgroup = {
  title: "Custom theme",
  configKey: "customTheme",
  list: [
    {
      id: "setCustomThemeOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setCustomTheme(false);
      },
    },
    {
      id: "setCustomThemeOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setCustomTheme(true);
      },
    },
  ],
};

export default commands;
