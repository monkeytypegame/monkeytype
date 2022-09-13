import * as UpdateConfig from "../../config";

const commands: MonkeyTypes.CommandsGroup = {
  title: "Key tips...",
  configKey: "showKeyTips",
  list: [
    {
      id: "setKeyTipsOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setKeyTips(false);
      },
    },
    {
      id: "setKeyTipsOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setKeyTips(true);
      },
    },
  ],
};

export default commands;
