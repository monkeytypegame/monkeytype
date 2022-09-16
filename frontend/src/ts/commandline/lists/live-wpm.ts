import * as UpdateConfig from "../../config";

const commands: MonkeyTypes.CommandsSubgroup = {
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

export default commands;
