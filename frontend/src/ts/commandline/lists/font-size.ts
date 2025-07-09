import {
  FontSize,
  FontSizeSchema,
} from "@monkeytype/contracts/schemas/configs";
import Config, * as UpdateConfig from "../../config";
import { Command, CommandWithValidation } from "../types";

const commands: Command[] = [
  {
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
  } as CommandWithValidation<FontSize> as Command,
];

export default commands;
