import * as UpdateConfig from "../../config";

const commands: MonkeyTypes.CommandsGroup = {
  title: "Smooth line scroll...",
  configKey: "smoothLineScroll",
  list: [
    {
      id: "setSmoothLineScrollOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setSmoothLineScroll(false);
      },
    },
    {
      id: "setSmoothLineScrollOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setSmoothLineScroll(true);
      },
    },
  ],
};

export default commands;
