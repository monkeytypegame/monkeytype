import * as UpdateConfig from "../../config";

const commands: MonkeyTypes.CommandsSubgroup = {
  title: "Flip test colors...",
  configKey: "flipTestColors",
  list: [
    {
      id: "setFlipTestColorsOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setFlipTestColors(false);
      },
    },
    {
      id: "setFlipTestColorsOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setFlipTestColors(true);
      },
    },
  ],
};

export default commands;
