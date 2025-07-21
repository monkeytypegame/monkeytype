import { MaxLineWidthSchema } from "@monkeytype/schemas/configs";
import Config, * as UpdateConfig from "../../config";
import { Command, withValidation } from "../types";

const commands: Command[] = [
  withValidation({
    id: "changeMaxLineWidth",
    display: "Max line width...",
    icon: "fa-text-width",
    alias: "page",
    input: true,
    defaultValue: (): string => {
      return Config.maxLineWidth.toString();
    },
    inputValueConvert: Number,
    validation: {
      schema: MaxLineWidthSchema,
    },
    exec: ({ input }): void => {
      if (input === undefined) return;
      UpdateConfig.setMaxLineWidth(input);
    },
  }),
];
export default commands;
