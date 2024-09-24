import Config, * as UpdateConfig from "../../config";
import { get as getTypingSpeedUnit } from "../../utils/typing-speed-units";
import { Command, CommandsSubgroup } from "../types";

const subgroup: CommandsSubgroup = {
  title: "Change min burst mode...",
  configKey: "minBurst",
  list: [
    {
      id: "setMinBurstOff",
      display: "off",
      configValue: "off",
      exec: (): void => {
        UpdateConfig.setMinBurst("off");
      },
    },
    {
      id: "setMinBurstFixed",
      display: "fixed...",
      configValue: "fixed",
      input: true,
      exec: ({ input }): void => {
        if (input === undefined || input === "") return;
        UpdateConfig.setMinBurst("fixed");
        const newVal = getTypingSpeedUnit(Config.typingSpeedUnit).toWpm(
          parseInt(input)
        );
        UpdateConfig.setMinBurstCustomSpeed(newVal);
      },
    },
    {
      id: "setMinBurstFlex",
      display: "flex...",
      configValue: "flex",
      input: true,
      exec: ({ input }): void => {
        if (input === undefined || input === "") return;
        UpdateConfig.setMinBurst("flex");
        const newVal = getTypingSpeedUnit(Config.typingSpeedUnit).toWpm(
          parseInt(input)
        );
        UpdateConfig.setMinBurstCustomSpeed(newVal);
      },
    },
  ],
};

const commands: Command[] = [
  {
    id: "changeMinBurst",
    display: "Minimum burst...",
    alias: "minimum",
    icon: "fa-bomb",
    subgroup,
  },
];

export default commands;
