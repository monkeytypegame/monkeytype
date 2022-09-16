import * as UpdateConfig from "../../config";

const subgroup: MonkeyTypes.CommandsSubgroup = {
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

const commands: MonkeyTypes.Command[] = [
  {
    id: "changeShowWordsHistory",
    display: "Always show words history...",
    icon: "fa-align-left",
    subgroup,
  },
];

export default commands;
