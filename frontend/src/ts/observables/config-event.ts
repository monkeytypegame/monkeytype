import { Config, ConfigKey, ConfigValue } from "@monkeytype/schemas/configs";

export type ConfigEventKey =
  | ConfigKey
  | "saveToLocalStorage"
  | "setThemes"
  | "configApplied"
  | "fullConfigChange"
  | "fullConfigChangeFinished";

type SubscribeParams = {
  key: ConfigEventKey;
  newValue?: ConfigValue;
  nosave?: boolean;
  previousValue?: ConfigValue;
  fullConfig?: Config;
};

type SubscribeFunction = (options: SubscribeParams) => void;

const subscribers: SubscribeFunction[] = [];

export function subscribe(fn: SubscribeFunction): void {
  subscribers.push(fn);
}

export function dispatch(options: SubscribeParams): void {
  subscribers.forEach((fn) => {
    try {
      fn(options);
    } catch (e) {
      console.error("Config event subscriber threw an error");
      console.error(e);
    }
  });
}
