import * as UpdateConfig from "../../config";

const commands: MonkeyTypes.CommandsGroup = {
  title: "Repeat quotes...",
  configKey: "repeatQuotes",
  list: [
    {
      id: "setRepeatQuotesOff",
      display: "off",
      configValue: "off",
      exec: (): void => {
        UpdateConfig.setRepeatQuotes("off");
      },
    },
    {
      id: "setRepeatQuotesTyping",
      display: "typing",
      configValue: "typing",
      exec: (): void => {
        UpdateConfig.setRepeatQuotes("typing");
      },
    },
  ],
};

export default commands;
