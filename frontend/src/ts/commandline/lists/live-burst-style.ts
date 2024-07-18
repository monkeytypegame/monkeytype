import * as UpdateConfig from "../../config";

const subgroup: MonkeyTypes.CommandsSubgroup = {
  title: "Live burst style...",
  configKey: "liveBurstStyle",
  list: [
    {
      id: "setLiveBurstStyleOff",
      display: "off",
      configValue: "off",
      exec: (): void => {
        UpdateConfig.setLiveBurstStyle("off");
      },
    },
    {
      id: "setLiveBurstStyleMini",
      display: "mini",
      configValue: "mini",
      exec: (): void => {
        UpdateConfig.setLiveBurstStyle("mini");
      },
    },
    {
      id: "setLiveBurstStyleText",
      display: "text",
      configValue: "text",
      exec: (): void => {
        UpdateConfig.setLiveBurstStyle("text");
      },
    },
  ],
};

const commands: MonkeyTypes.Command[] = [
  {
    id: "changeLiveBurstStyle",
    display: "Live burst style...",
    icon: "fa-tachometer-alt",
    alias: "wpm",
    subgroup,
  },
];

export default commands;
