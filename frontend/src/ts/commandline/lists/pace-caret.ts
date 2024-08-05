import Config, * as UpdateConfig from "../../config";
import * as TestLogic from "../../test/test-logic";
import { get as getTypingSpeedUnit } from "../../utils/typing-speed-units";

const subgroup: MonkeyTypes.CommandsSubgroup = {
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
      id: "setPaceCaretTagPb",
      display: "tag pb",
      configValue: "tagPb",
      exec: (): void => {
        UpdateConfig.setPaceCaret("tagPb");
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
      id: "setPaceCaretDaily",
      display: "daily",
      configValue: "daily",
      exec: (): void => {
        UpdateConfig.setPaceCaret("daily");
        TestLogic.restart();
      },
    },
    {
      id: "setPaceCaretCustom",
      display: "custom...",
      configValue: "custom",
      input: true,
      exec: ({ input }): void => {
        if (input === undefined || input === "") return;
        const newVal = getTypingSpeedUnit(Config.typingSpeedUnit).toWpm(
          parseInt(input)
        );
        UpdateConfig.setPaceCaretCustomSpeed(newVal);
        UpdateConfig.setPaceCaret("custom");
        TestLogic.restart();
      },
    },
  ],
};

const commands: MonkeyTypes.Command[] = [
  {
    id: "changePaceCaret",
    display: "Pace caret mode...",
    icon: "fa-i-cursor",
    subgroup,
  },
];

export default commands;
