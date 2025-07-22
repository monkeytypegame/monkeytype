import { MinimumAccuracyCustomSchema } from "@monkeytype/schemas/configs";
import * as UpdateConfig from "../../config";
import { Command, CommandsSubgroup, withValidation } from "../types";

const subgroup: CommandsSubgroup = {
  title: "Minimum accuracy...",
  configKey: "minAcc",
  list: [
    {
      id: "setMinAccOff",
      display: "off",
      configValue: "off",
      exec: (): void => {
        UpdateConfig.setMinAcc("off");
      },
    },
    withValidation({
      id: "setMinAccCustom",
      display: "custom...",
      configValue: "custom",
      input: true,
      inputValueConvert: Number,
      validation: { schema: MinimumAccuracyCustomSchema },
      exec: ({ input }): void => {
        if (input === undefined) return;
        UpdateConfig.setMinAccCustom(input);
        UpdateConfig.setMinAcc("custom");
      },
    }),
  ],
};

const commands: Command[] = [
  {
    id: "changeMinAcc",
    display: "Minimum accuracy...",
    alias: "minimum",
    icon: "fa-bomb",
    subgroup,
  },
];

export default commands;
