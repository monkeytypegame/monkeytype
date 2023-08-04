import * as UpdateConfig from "../../config";

const subgroup: MonkeyTypes.CommandsSubgroup = {
  title: "Live speed...",
  configKey: "liveSpeed",
  list: [
    {
      id: "setLiveSpeedOff",
      display: "off",
      configValue: false,
      alias: "live wpm",
      exec: (): void => {
        UpdateConfig.setLiveSpeed(false);
      },
    },
    {
      id: "setLiveSpeedOn",
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
    id: "changeLiveSpeed",
    display: "Live speed...",
    icon: "fa-tachometer-alt",
    subgroup,
  },
];

export default commands;
