import * as UpdateConfig from "../../config";

const commands: MonkeyTypes.CommandsGroup = {
  title: "Live accuracy...",
  configKey: "showLiveAcc",
  list: [
    {
      id: "setLiveAccOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setShowLiveAcc(false);
      },
    },
    {
      id: "setLiveAccOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setShowLiveAcc(true);
      },
    },
  ],
};

export default commands;
