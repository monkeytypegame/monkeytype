import Config, * as UpdateConfig from "../../config";
import { get as getTypingSpeedUnit } from "../../utils/typing-speed-units";
import { Command, CommandsSubgroup } from "../types";

const subgroup: CommandsSubgroup = {
  title: "Minimum word burst...",
  configKey: "minBurst",
  list: [
    {
      id: "setMinBurstOff",
      display: "off",
      configValue: "off",
      exec: (): void => {
        UpdateConfig.setConfig("minBurst", "off");
      },
    },
    {
      id: "setMinBurstFixed",
      display: "fixed...",
      configValue: "fixed",
      input: true,
      exec: ({ input }): void => {
        if (input === undefined || input === "") return;
        UpdateConfig.setConfig("minBurst", "fixed");
        const newVal = getTypingSpeedUnit(Config.typingSpeedUnit).toWpm(
          parseInt(input),
        );
        UpdateConfig.setConfig("minBurstCustomSpeed", newVal);
      },
    },
    {
      id: "setMinBurstFlex",
      display: "flex...",
      configValue: "flex",
      input: true,
      exec: ({ input }): void => {
        if (input === undefined || input === "") return;
        UpdateConfig.setConfig("minBurst", "flex");
        const newVal = getTypingSpeedUnit(Config.typingSpeedUnit).toWpm(
          parseInt(input),
        );
        UpdateConfig.setConfig("minBurstCustomSpeed", newVal);
      },
    },
  ],
};

const commands: Command[] = [
  {
    id: "changeMinBurst",
    display: "Minimum word burst...",
    alias: "minimum",
    icon: "fa-bomb",
    subgroup,
  },
];

export default commands;
