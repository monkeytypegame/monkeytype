import type { Config as ConfigSchema } from "@monkeytype/schemas/configs";
import { getDefaultConfig } from "../constants/default-config";

const Config: ConfigSchema = {
  ...getDefaultConfig(),
};

const getConfig = (): ConfigSchema => Config;

export { Config, getConfig };
