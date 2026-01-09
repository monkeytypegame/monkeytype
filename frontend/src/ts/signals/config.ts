import { createSignal } from "solid-js";
import * as ConfigEvent from "../observables/config-event";
import config from "../config";
import { Config } from "@monkeytype/schemas/configs";

const [getConfigSignal, setConfigSignal] = createSignal<Config>(config);

export { getConfigSignal };

ConfigEvent.subscribe(() => {
  setConfigSignal(structuredClone(config));
});
