import * as UpdateConfig from "../../config";

const subgroup: MonkeyTypes.CommandsSubgroup = {
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

const commands: MonkeyTypes.Command[] = [
  {
    id: "setCustomTheme",
    display: "Custom theme...",
    icon: "fa-palette",
    subgroup,
  },
];

export default commands;
