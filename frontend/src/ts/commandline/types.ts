import { Config } from "@monkeytype/schemas/configs";
import AnimatedModal from "../utils/animated-modal";
import { Validation } from "../elements/input-validation";

// this file is needed becauase otherwise it would produce a circular dependency

export type CommandExecOptions<T> = {
  input?: T;
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
  configValue?: Config[keyof Config];
  configValueMode?: "include";
  exec?: (options: CommandExecOptions<string>) => void;
  hover?: () => void;
  available?: () => boolean | Promise<boolean>;
  active?: () => boolean;
  shouldFocusTestUI?: boolean;
  customData?: Record<string, string | boolean>;
};

export type CommandWithValidation<T> = (T extends string
  ? Command
  : Omit<Command, "exec"> & {
      inputValueConvert: (val: string) => T;
      exec?: (options: CommandExecOptions<T>) => void;
    }) & {
  /**
   * Validate the input value and indicate the validation result
   * If the schema is defined it is always checked first.
   * Only if the schema validaton is passed or missing the `isValid` method is called.
   */
  validation: Validation<T>;
};

export type CommandsSubgroup = {
  title: string;
  configKey?: keyof Config;
  list: Command[];
  beforeList?: () => void;
};

export function withValidation<T>(command: CommandWithValidation<T>): Command {
  return command as unknown as Command;
}
