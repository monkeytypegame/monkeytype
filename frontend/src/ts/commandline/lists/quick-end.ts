import * as UpdateConfig from "../../config";

const commands: MonkeyTypes.CommandsGroup = {
  title: "Quick end...",
  configKey: "quickEnd",
  list: [
    {
      id: "setQuickEndOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setQuickEnd(false);
      },
    },
    {
      id: "setQuickEndOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setQuickEnd(true);
      },
    },
  ],
};

export default commands;
