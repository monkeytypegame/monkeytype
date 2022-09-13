import * as UpdateConfig from "../../config";

const commands: MonkeyTypes.CommandsGroup = {
  title: "Confidence mode...",
  configKey: "confidenceMode",
  list: [
    {
      id: "changeConfidenceModeOff",
      display: "off",
      configValue: "off",
      exec: (): void => {
        UpdateConfig.setConfidenceMode("off");
      },
    },
    {
      id: "changeConfidenceModeOn",
      display: "on",
      configValue: "on",
      exec: (): void => {
        UpdateConfig.setConfidenceMode("on");
      },
    },
    {
      id: "changeConfidenceModeMax",
      display: "max",
      configValue: "max",
      exec: (): void => {
        UpdateConfig.setConfidenceMode("max");
      },
    },
  ],
};

export default commands;
