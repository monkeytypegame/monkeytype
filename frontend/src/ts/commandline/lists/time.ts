import * as UpdateConfig from "../../config";
import * as TestLogic from "../../test/test-logic";
import { Command } from "../types";

const commands: Command[] = [
  {
    id: "changeTimeConfig",
    display: "Time...",
    icon: "fa-clock",
    subgroup: {
      title: "Change time config...",
      configKey: "time",
      list: [
        {
          id: "changeTimeConfig15",
          display: "15",
          configValue: 15,
          exec: (): void => {
            UpdateConfig.setMode("time");
            UpdateConfig.setTimeConfig(15);
            TestLogic.restart();
          },
        },
        {
          id: "changeTimeConfig30",
          display: "30",
          configValue: 30,
          exec: (): void => {
            UpdateConfig.setMode("time");
            UpdateConfig.setTimeConfig(30);
            TestLogic.restart();
          },
        },
        {
          id: "changeTimeConfig60",
          display: "60",
          configValue: 60,
          exec: (): void => {
            UpdateConfig.setMode("time");
            UpdateConfig.setTimeConfig(60);
            TestLogic.restart();
          },
        },
        {
          id: "changeTimeConfig120",
          display: "120",
          configValue: 120,
          exec: (): void => {
            UpdateConfig.setMode("time");
            UpdateConfig.setTimeConfig(120);
            TestLogic.restart();
          },
        },
        {
          id: "changeTimeConfigCustom",
          display: "custom...",
          input: true,
          exec: ({ input }): void => {
            if (input === undefined || input === "") return;
            UpdateConfig.setMode("time");
            UpdateConfig.setTimeConfig(parseInt(input));
            TestLogic.restart();
          },
        },
      ],
    },
  },
];

export default commands;
