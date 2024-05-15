import * as UpdateConfig from "../../config";

const subgroup: MonkeyTypes.CommandsSubgroup = {
  title: "Live speed style...",
  configKey: "liveSpeedStyle",
  list: [
    {
      id: "setLiveSpeedStyleOff",
      display: "off",
      configValue: "off",
      exec: (): void => {
        UpdateConfig.setLiveSpeedStyle("off");
      },
    },
    {
      id: "setLiveSpeedStyleMini",
      display: "mini",
      configValue: "mini",
      exec: (): void => {
        UpdateConfig.setLiveSpeedStyle("mini");
      },
    },
    {
      id: "setLiveSpeedStyleText",
      display: "text",
      configValue: "text",
      exec: (): void => {
        UpdateConfig.setLiveSpeedStyle("text");
      },
    },
  ],
};

const commands: MonkeyTypes.Command[] = [
  {
    id: "changeLiveSpeedStyle",
    display: "Live speed style...",
    icon: "fa-tachometer-alt",
    alias: "wpm",
    subgroup,
  },
];

export default commands;
