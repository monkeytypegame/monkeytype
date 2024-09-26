import * as UpdateConfig from "../../config";
import { Command, CommandsSubgroup } from "../types";

const subgroup: CommandsSubgroup = {
  title: "Live progress style...",
  configKey: "timerStyle",
  list: [
    {
      id: "setTimerStyleOff",
      display: "off",
      configValue: "off",
      exec: (): void => {
        UpdateConfig.setTimerStyle("off");
      },
    },
    {
      id: "setTimerStyleBar",
      display: "bar",
      configValue: "bar",
      exec: (): void => {
        UpdateConfig.setTimerStyle("bar");
      },
    },
    {
      id: "setTimerStyleText",
      display: "text",
      configValue: "text",
      exec: (): void => {
        UpdateConfig.setTimerStyle("text");
      },
    },
    {
      id: "setTimerStyleMini",
      display: "mini",
      configValue: "mini",
      exec: (): void => {
        UpdateConfig.setTimerStyle("mini");
      },
    },
  ],
};

const commands: Command[] = [
  {
    id: "changeTimerStyle",
    display: "Live progress style...",
    icon: "fa-chart-pie",
    alias: "timer",
    subgroup,
  },
];

export default commands;
