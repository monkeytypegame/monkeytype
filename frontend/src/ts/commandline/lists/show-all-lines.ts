import * as UpdateConfig from "../../config";

const commands: MonkeyTypes.CommandsGroup = {
  title: "Show all lines...",
  configKey: "showAllLines",
  list: [
    {
      id: "setShowAllLinesOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setShowAllLines(false);
      },
    },
    {
      id: "setShowAllLinesOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setShowAllLines(true);
      },
    },
  ],
};

export default commands;
