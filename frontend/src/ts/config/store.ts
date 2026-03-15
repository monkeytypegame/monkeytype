import type { Config as ConfigSchema } from "@monkeytype/schemas/configs";
import { getDefaultConfig } from "../constants/default-config";
import { promiseWithResolvers } from "../utils/misc";

let Config: ConfigSchema = {
  ...getDefaultConfig(),
};

const getConfig = (): ConfigSchema => Config;

const { promise: configLoadPromise, resolve: loadDone } =
  promiseWithResolvers();

export { Config, configLoadPromise, loadDone, getConfig };
