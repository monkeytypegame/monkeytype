import { FontSizeSchema } from "@monkeytype/schemas/configs";
import Config, * as UpdateConfig from "../../config";
import { Command, withValidation } from "../types";

const commands: Command[] = [
  withValidation({
    id: "changeFontSize",
    display: "Font size...",
    icon: "fa-font",
    input: true,
    defaultValue: (): string => {
      return Config.fontSize.toString();
    },
    inputValueConvert: Number,
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
