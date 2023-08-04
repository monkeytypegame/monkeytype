import * as UpdateConfig from "../../config";

const subgroup: MonkeyTypes.CommandsSubgroup = {
  title: "Live speed...",
  configKey: "liveSpeed",
  list: [
    {
      id: "setLiveWpmOff",
      display: "off",
      configValue: false,
      alias: "live wpm",
      exec: (): void => {
        UpdateConfig.setLiveSpeed(false);
      },
    },
    {
      id: "setLiveWpmOn",
      display: "on",
      configValue: true,
      alias: "live wpm",
      exec: (): void => {
        UpdateConfig.setLiveSpeed(true);
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
