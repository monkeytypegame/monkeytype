import { Config } from "@monkeytype/schemas/configs";
import { ConfigMetadata } from "../config-metadata";

export type ConfigEventKey =
  | keyof Config
  | "fullConfigChange"
  | "fullConfigChangeFinished"
  | "configApplied";

export type ConfigEventOptions = {
  nosave?: boolean;
  fullConfig?: Config;
} & {
  [K in ConfigEventKey]?: K extends keyof Config
    ? {
        key: K;
        newValue: Config[K];
        previousValue: Config[K];
        metadata: ConfigMetadata<K>;
      }
    : {
        key: K;
        newValue?: undefined;
        previousValue?: undefined;
        metadata?: undefined;
      };
}[ConfigEventKey];

type SubscribeFunction = (options: ConfigEventOptions) => void;

const subscribers: SubscribeFunction[] = [];

export function subscribe(fn: SubscribeFunction): void {
  subscribers.push(fn);
}

export function dispatch(options: ConfigEventOptions): void {
  console.log("dispatching config event", options);
  subscribers.forEach((fn) => {
    try {
      fn(options);
    } catch (e) {
      console.error("Config event subscriber threw an error");
      console.error(e);
    }
  });
}
