import {
  Config,
  ConfigKey,
  ConfigValue,
} from "@monkeytype/contracts/schemas/configs";

export type ConfigEventKey =
  | ConfigKey
  | "saveToLocalStorage"
  | "setThemes"
  | "configApplied"
  | "fullConfigChange"
  | "fullConfigChangeFinished";

type SubscribeFunction = (
  key: ConfigEventKey,
  newValue?: ConfigValue,
  nosave?: boolean,
  previousValue?: ConfigValue,
  fullConfig?: Config
) => void;

const subscribers: SubscribeFunction[] = [];

export function subscribe(fn: SubscribeFunction): void {
  subscribers.push(fn);
}

export function dispatch(
  key: ConfigEventKey,
  newValue?: ConfigValue,
  nosave?: boolean,
  previousValue?: ConfigValue,
  fullConfig?: Config
): void {
  subscribers.forEach((fn) => {
    try {
      fn(key, newValue, nosave, previousValue, fullConfig);
    } catch (e) {
      console.error("Config event subscriber threw an error");
      console.error(e);
    }
  });
}
