import * as UpdateConfig from "../../config";
import * as TestLogic from "../../test/test-logic";

const commands: MonkeyTypes.CommandsGroup = {
  title: "Lazy mode...",
  configKey: "lazyMode",
  list: [
    {
      id: "setLazyModeOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setLazyMode(false);
        TestLogic.restart();
      },
    },
    {
      id: "setLazyModeOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setLazyMode(true);
        TestLogic.restart();
      },
    },
  ],
};

export default commands;
