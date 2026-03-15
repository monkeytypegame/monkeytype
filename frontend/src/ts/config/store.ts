import { Config } from "@monkeytype/schemas/configs";
import { getDefaultConfig } from "../constants/default-config";
import { promiseWithResolvers } from "../utils/misc";

let config: Config = {
  ...getDefaultConfig(),
};

const getConfig = (): Config => config;

const { promise: configLoadPromise, resolve: loadDone } =
  promiseWithResolvers();

export { configLoadPromise, loadDone, getConfig };
export default config;
