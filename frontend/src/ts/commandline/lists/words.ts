import * as UpdateConfig from "../../config";
import * as TestLogic from "../../test/test-logic";
import { Command } from "../types";

const commands: Command[] = [
  {
    id: "changeWordCount",
    display: "Words...",
    alias: "words",
    icon: "fa-font",
    subgroup: {
      title: "Change word count...",
      configKey: "words",
      list: [
        {
          id: "changeWordCount10",
          display: "10",
          configValue: 10,
          exec: (): void => {
            UpdateConfig.setMode("words");
            UpdateConfig.setWordCount(10);
            TestLogic.restart();
          },
        },
        {
          id: "changeWordCount25",
          display: "25",
          configValue: 25,
          exec: (): void => {
            UpdateConfig.setMode("words");
            UpdateConfig.setWordCount(25);
            TestLogic.restart();
          },
        },
        {
          id: "changeWordCount50",
          display: "50",
          configValue: 50,
          exec: (): void => {
            UpdateConfig.setMode("words");
            UpdateConfig.setWordCount(50);
            TestLogic.restart();
          },
        },
        {
          id: "changeWordCount100",
          display: "100",
          configValue: 100,
          exec: (): void => {
            UpdateConfig.setMode("words");
            UpdateConfig.setWordCount(100);
            TestLogic.restart();
          },
        },
        {
          id: "changeWordCount200",
          display: "200",
          configValue: 200,
          exec: (): void => {
            UpdateConfig.setMode("words");
            UpdateConfig.setWordCount(200);
            TestLogic.restart();
          },
        },
        {
          id: "changeWordCountCustom",
          display: "custom...",
          input: true,
          exec: ({ input }): void => {
            if (input === undefined || input === "") return;
            UpdateConfig.setMode("words");
            UpdateConfig.setWordCount(parseInt(input));
            TestLogic.restart();
          },
        },
      ],
    },
  },
];

export default commands;
