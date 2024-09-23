import Config, * as UpdateConfig from "../../config";
import { get as getTypingSpeedUnit } from "../../utils/typing-speed-units";
import { Command, CommandsSubgroup } from "../types";

const subgroup: CommandsSubgroup = {
  title: "Change min speed mode...",
  configKey: "minWpm",
  list: [
    {
      id: "setMinWpmOff",
      display: "off",
      configValue: "off",
      exec: (): void => {
        UpdateConfig.setMinWpm("off");
      },
    },
    {
      id: "setMinWpmCustom",
      display: "custom...",
      configValue: "custom",
      input: true,
      exec: ({ input }): void => {
        if (input === undefined || input === "") return;
        const newVal = getTypingSpeedUnit(Config.typingSpeedUnit).toWpm(
          parseInt(input)
        );
        UpdateConfig.setMinWpmCustomSpeed(newVal);
        UpdateConfig.setMinWpm("custom");
      },
    },
  ],
};

const commands: Command[] = [
  {
    id: "changeMinWpm",
    display: "Minimum speed...",
    alias: "minimum wpm",
    icon: "fa-bomb",
    subgroup,
  },
];

export default commands;
