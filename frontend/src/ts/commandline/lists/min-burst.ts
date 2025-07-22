import { MinimumBurstCustomSpeedSchema } from "@monkeytype/schemas/configs";
import Config, * as UpdateConfig from "../../config";
import { get as getTypingSpeedUnit } from "../../utils/typing-speed-units";
import { Command, CommandsSubgroup, withValidation } from "../types";

const subgroup: CommandsSubgroup = {
  title: "Minimum burst...",
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
    withValidation({
      id: "setMinBurstFixed",
      display: "fixed...",
      configValue: "fixed",
      input: true,
      inputValueConvert: Number,
      validation: { schema: MinimumBurstCustomSpeedSchema },
      exec: ({ input }): void => {
        if (input === undefined) return;
        UpdateConfig.setMinBurst("fixed");
        const newVal = getTypingSpeedUnit(Config.typingSpeedUnit).toWpm(input);
        UpdateConfig.setMinBurstCustomSpeed(newVal);
      },
    }),
    withValidation({
      id: "setMinBurstFlex",
      display: "flex...",
      configValue: "flex",
      input: true,
      inputValueConvert: Number,
      validation: { schema: MinimumBurstCustomSpeedSchema },
      exec: ({ input }): void => {
        if (input === undefined) return;
        UpdateConfig.setMinBurst("flex");
        const newVal = getTypingSpeedUnit(Config.typingSpeedUnit).toWpm(input);
        UpdateConfig.setMinBurstCustomSpeed(newVal);
      },
    }),
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
