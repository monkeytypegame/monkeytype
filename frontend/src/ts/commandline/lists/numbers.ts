import * as UpdateConfig from "../../config";
import * as TestLogic from "../../test/test-logic";

const commands: MonkeyTypes.CommandsSubgroup = {
  title: "Numbers...",
  configKey: "numbers",
  list: [
    {
      id: "changeNumbersOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setNumbers(true);
        TestLogic.restart();
      },
    },
    {
      id: "changeNumbersOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setNumbers(false);
        TestLogic.restart();
      },
    },
  ],
};

export default commands;
