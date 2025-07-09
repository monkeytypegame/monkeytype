import { FontSizeSchema } from "@monkeytype/contracts/schemas/configs";
import Config, * as UpdateConfig from "../../config";
import { Command } from "../types";
import { withValidation } from "../commandline";

const commands: Command[] = [
  withValidation({
    id: "changeFontSize",
    display: "Font size...",
    icon: "fa-font",
    input: true,
    defaultValue: (): string => {
      return Config.fontSize.toString();
    },
    valueConvert: Number,
    validation: {
      schema: FontSizeSchema,
    },
    exec: ({ input }): void => {
      if (input === undefined) return;
      UpdateConfig.setFontSize(input);
    },
  }),
];

export default commands;
