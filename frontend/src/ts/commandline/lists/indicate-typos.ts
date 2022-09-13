import * as UpdateConfig from "../../config";

const commands: MonkeyTypes.CommandsGroup = {
  title: "Indicate typos...",
  configKey: "indicateTypos",
  list: [
    {
      id: "setIndicateTyposOff",
      display: "off",
      configValue: "off",
      exec: (): void => {
        UpdateConfig.setIndicateTypos("off");
      },
    },
    {
      id: "setIndicateTyposBelow",
      display: "below",
      configValue: "below",
      exec: (): void => {
        UpdateConfig.setIndicateTypos("below");
      },
    },
    {
      id: "setIndicateTyposReplace",
      display: "replace",
      configValue: "replace",
      exec: (): void => {
        UpdateConfig.setIndicateTypos("replace");
      },
    },
  ],
};

export default commands;
