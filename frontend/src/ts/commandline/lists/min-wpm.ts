import { MinWpmCustomSpeedSchema } from "@monkeytype/schemas/configs";
import Config, * as UpdateConfig from "../../config";
import { get as getTypingSpeedUnit } from "../../utils/typing-speed-units";
import { Command, CommandsSubgroup, withValidation } from "../types";

const subgroup: CommandsSubgroup = {
  title: "Minimum speed...",
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
    withValidation({
      id: "setMinWpmCustom",
      display: "custom...",
      configValue: "custom",
      input: true,
      inputValueConvert: Number,
      validation: { schema: MinWpmCustomSpeedSchema },
      exec: ({ input }): void => {
        if (input === undefined) return;
        const newVal = getTypingSpeedUnit(Config.typingSpeedUnit).toWpm(input);
        UpdateConfig.setMinWpmCustomSpeed(newVal);
        UpdateConfig.setMinWpm("custom");
      },
    }),
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
