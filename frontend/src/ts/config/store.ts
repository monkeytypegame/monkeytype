import type { Config as ConfigSchema } from "@monkeytype/schemas/configs";
import { getDefaultConfig } from "../constants/default-config";
import { createStore } from "solid-js/store";

export const Config: ConfigSchema = {
  ...getDefaultConfig(),
};

export const [getConfig, setConfigStore] =
  createStore<ConfigSchema>(getDefaultConfig());
