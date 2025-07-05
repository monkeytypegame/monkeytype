import { Config } from "@monkeytype/contracts/schemas/configs";
import AnimatedModal from "../utils/animated-modal";
import { z } from "zod";

// this file is needed becauase otherwise it would produce a circular dependency

export type CommandExecOptions = {
  input?: string;
  commandlineModal: AnimatedModal;
};

export type Command = {
  id: string;
  display: string;
  singleListDisplay?: string;
  singleListDisplayNoIcon?: string;
  subgroup?: CommandsSubgroup;
  found?: boolean;
  icon?: string;
  iconType?: "regular" | "solid";
  sticky?: boolean;
  alias?: string;
  input?: boolean;
  visible?: boolean;
  customStyle?: string;
  opensModal?: boolean;
  defaultValue?: () => string;
  configKey?: keyof Config;
  configValue?: string | number | boolean | number[];
  configValueMode?: "include";
  exec?: (options: CommandExecOptions) => void;
  hover?: () => void;
  available?: () => boolean;
  active?: () => boolean;
  shouldFocusTestUI?: boolean;
  customData?: Record<string, string | boolean>;
};

export type CommandWithValidation<T> = Command & {
  valueConvert?: (val: string) => T | string;

  /**
   * Validate the input value and indicate the validation result
   * If the schema is defined it is always checked first.
   * Only if the schema validaton is passed or missing the `isValid` method is called.
   */
  validation: {
    /**
     * Zod schema to validate the input value against.
     * The indicator will show the error messages from the schema.
     */
    schema?: z.Schema<T>;
    /**
     * Custom async validation method.
     * This is intended to be used for validations that cannot be handled with a Zod schema like server-side validations.
     * @param value current input value
     * @param thisPopup the current modal
     * @returns true if the `value` is valid, an errorMessage as string if it is invalid.
     */
    isValid?: (value: T) => Promise<true | string>;
  };
};

export type CommandsSubgroup = {
  title: string;
  configKey?: keyof Config;
  list: Command[];
  beforeList?: () => void;
};
