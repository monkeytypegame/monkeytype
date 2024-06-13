import * as UpdateConfig from "../../config";

const subgroup: MonkeyTypes.CommandsSubgroup = {
  title: "Live acc style...",
  configKey: "liveAccStyle",
  list: [
    {
      id: "setLiveAccStyleOff",
      display: "off",
      configValue: "off",
      exec: (): void => {
        UpdateConfig.setLiveAccStyle("off");
      },
    },
    {
      id: "setLiveAccStyleMini",
      display: "mini",
      configValue: "mini",
      exec: (): void => {
        UpdateConfig.setLiveAccStyle("mini");
      },
    },
    {
      id: "setLiveAccStyleText",
      display: "text",
      configValue: "text",
      exec: (): void => {
        UpdateConfig.setLiveAccStyle("text");
      },
    },
  ],
};

const commands: MonkeyTypes.Command[] = [
  {
    id: "changeLiveAccStyle",
    display: "Live acc style...",
    icon: "fa-tachometer-alt",
    alias: "wpm",
    subgroup,
  },
];

export default commands;
