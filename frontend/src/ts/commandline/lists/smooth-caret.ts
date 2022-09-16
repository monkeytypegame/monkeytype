import * as UpdateConfig from "../../config";

const commands: MonkeyTypes.CommandsSubgroup = {
  title: "Smooth caret...",
  configKey: "smoothCaret",
  list: [
    {
      id: "changeSmoothCaretOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setSmoothCaret(true);
      },
    },
    {
      id: "changeSmoothCaretOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setSmoothCaret(false);
      },
    },
  ],
};

export default commands;
