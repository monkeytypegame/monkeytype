import { Config } from "@monkeytype/schemas/configs";

export type ConfigEventKey =
  | keyof Config
  | "fullConfigChange"
  | "fullConfigChangeFinished"
  | "configApplied";

type SubscribeParams = {
  nosave?: boolean;
  fullConfig?: Config;
} & {
  [K in ConfigEventKey]?: K extends keyof Config
    ? { key: K; newValue: Config[K]; previousValue: Config[K] }
    : { key: K; newValue?: undefined; previousValue?: undefined };
}[ConfigEventKey];

type SubscribeFunction = (options: SubscribeParams) => void;

const subscribers: SubscribeFunction[] = [];

export function subscribe(fn: SubscribeFunction): void {
  subscribers.push(fn);
}

export function dispatch(options: SubscribeParams): void {
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
