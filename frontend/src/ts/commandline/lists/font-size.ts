import { FontSizeSchema } from "@monkeytype/contracts/schemas/configs";
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
      isValid: async (value: number) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        if (value < 10) return true;
        return "number to big";
      },
    },
    exec: ({ input }): void => {
      if (input === undefined || input === "") return;
      UpdateConfig.setFontSize(parseFloat(input));
    },
  } as CommandWithValidation<number>,
];
export default commands;
