import * as UpdateConfig from "../../config";

const subgroup: MonkeyTypes.CommandsSubgroup = {
  title: "Live speed...",
  configKey: "showLiveWpm",
  list: [
    {
      id: "setLiveWpmOff",
      display: "off",
      configValue: false,
      alias: "live wpm",
      exec: (): void => {
        UpdateConfig.setShowLiveWpm(false);
      },
    },
    {
      id: "setLiveWpmOn",
      display: "on",
      configValue: true,
      alias: "live wpm",
      exec: (): void => {
        UpdateConfig.setShowLiveWpm(true);
      },
    },
  ],
};

const commands: MonkeyTypes.Command[] = [
  {
    id: "changeLiveWpm",
    display: "Live speed...",
    icon: "fa-tachometer-alt",
    subgroup,
  },
];

export default commands;
