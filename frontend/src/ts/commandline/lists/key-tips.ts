import * as UpdateConfig from "../../config";

const subgroup: MonkeyTypes.CommandsSubgroup = {
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

const commands: MonkeyTypes.Command[] = [
  {
    id: "changeKeyTips",
    display: "Key tips...",
    icon: "fa-question",
    subgroup,
  },
];

export default commands;
