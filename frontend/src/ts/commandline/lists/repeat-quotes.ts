import * as UpdateConfig from "../../config";

const subgroup: MonkeyTypes.CommandsSubgroup = {
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

const commands: MonkeyTypes.Command[] = [
  {
    id: "changeRepeatQuotes",
    display: "Repeat quotes...",
    icon: "fa-sync-alt",
    subgroup,
  },
];

export default commands;
