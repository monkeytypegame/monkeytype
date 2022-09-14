import * as UpdateConfig from "../../config";
import * as TestLogic from "../../test/test-logic";

const commands: MonkeyTypes.CommandsGroup = {
  title: "Pace caret mode...",
  configKey: "paceCaret",
  list: [
    {
      id: "setPaceCaretOff",
      display: "off",
      configValue: "off",
      exec: (): void => {
        UpdateConfig.setPaceCaret("off");
        TestLogic.restart();
      },
    },
    {
      id: "setPaceCaretPb",
      display: "pb",
      configValue: "pb",
      exec: (): void => {
        UpdateConfig.setPaceCaret("pb");
        TestLogic.restart();
      },
    },
    {
      id: "setPaceCaretLast",
      display: "last",
      configValue: "last",
      exec: (): void => {
        UpdateConfig.setPaceCaret("last");
        TestLogic.restart();
      },
    },
    {
      id: "setPaceCaretAverage",
      display: "average",
      configValue: "average",
      exec: (): void => {
        UpdateConfig.setPaceCaret("average");
        TestLogic.restart();
      },
    },
    {
      id: "setPaceCaretCustom",
      display: "custom...",
      configValue: "custom",
      input: true,
      exec: (input): void => {
        if (!input) return;
        UpdateConfig.setPaceCaretCustomSpeed(parseInt(input));
        UpdateConfig.setPaceCaret("custom");
        TestLogic.restart();
      },
    },
  ],
};

export default commands;
