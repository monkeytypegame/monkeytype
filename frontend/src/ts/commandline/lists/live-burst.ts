import * as UpdateConfig from "../../config";

const commands: MonkeyTypes.CommandsGroup = {
  title: "Live burst...",
  configKey: "showLiveBurst",
  list: [
    {
      id: "setLiveBurstOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setShowLiveBurst(false);
      },
    },
    {
      id: "setLiveBurstOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setShowLiveBurst(true);
      },
    },
  ],
};

export default commands;
