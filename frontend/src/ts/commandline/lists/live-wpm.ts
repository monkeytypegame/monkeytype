import * as UpdateConfig from "../../config";

const subgroup: MonkeyTypes.CommandsSubgroup = {
  title: "Live WPM...",
  configKey: "showLiveWpm",
  list: [
    {
      id: "setLiveWpmOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setShowLiveWpm(false);
      },
    },
    {
      id: "setLiveWpmOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setShowLiveWpm(true);
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
