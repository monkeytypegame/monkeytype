import { Config } from "@monkeytype/contracts/schemas/configs";
import AnimatedModal from "../utils/animated-modal";

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

export type CommandsSubgroup = {
  title: string;
  configKey?: keyof Config;
  list: Command[];
  beforeList?: () => void;
};
