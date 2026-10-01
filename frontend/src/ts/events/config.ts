import { Config } from "@monkeytype/schemas/configs";
import { createEvent } from "../hooks/createEvent";

export type ConfigEventKey =
  | keyof Config
  | "fullConfigChange"
  | "fullConfigChangeFinished";

export type ConfigEventData = {
  nosave?: boolean;
  fullConfig?: Config;
} & {
  [K in ConfigEventKey]?: K extends keyof Config
    ? { key: K; newValue: Config[K]; previousValue: Config[K] }
    : { key: K; newValue?: undefined; previousValue?: undefined };
}[ConfigEventKey];

export const configEvent = createEvent<ConfigEventData>();
