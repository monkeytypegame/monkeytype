import * as UpdateConfig from "../../config";

const commands: MonkeyTypes.CommandsSubgroup = {
  title: "Always show words history...",
  configKey: "alwaysShowWordsHistory",
  list: [
    {
      id: "setAlwaysShowWordsHistoryOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setAlwaysShowWordsHistory(false);
      },
    },
    {
      id: "setAlwaysShowWordsHistoryOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setAlwaysShowWordsHistory(true);
      },
    },
  ],
};

export default commands;
