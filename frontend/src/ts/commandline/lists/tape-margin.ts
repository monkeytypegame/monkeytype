import { TapeMarginSchema } from "@monkeytype/schemas/configs";
import Config, * as UpdateConfig from "../../config";
import { Command, withValidation } from "../types";

const commands: Command[] = [
  withValidation({
    id: "changeTapeMargin",
    display: "Tape margin...",
    icon: "fa-tape",
    input: true,
    defaultValue: (): string => {
      return Config.tapeMargin.toString();
    },
    inputValueConvert: Number,
    validation: { schema: TapeMarginSchema },
    exec: ({ input }): void => {
      if (input === undefined) return;
      UpdateConfig.setTapeMargin(input);
    },
  }),
];
export default commands;
