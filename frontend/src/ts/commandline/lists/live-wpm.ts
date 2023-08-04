import * as UpdateConfig from "../../config";

const subgroup: MonkeyTypes.CommandsSubgroup = {
  title: "Live speed...",
  configKey: "liveSpeed",
  list: [
    {
      id: "setLiveWpmOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setLiveSpeed(false);
      },
    },
    {
      id: "setLiveWpmOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setLiveSpeed(true);
      },
    },
  ],
};

const commands: MonkeyTypes.Command[] = [
  {
    id: "changeLiveWpm",
    display: "Live WPM...",
    icon: "fa-tachometer-alt",
    subgroup,
  },
];

export default commands;
