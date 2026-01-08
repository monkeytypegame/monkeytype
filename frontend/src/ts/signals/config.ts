import { createSignal } from "solid-js";
import * as ConfigEvent from "../observables/config-event";
import config from "../config";

export const [getLiveSpeedStyle, setLifeSpeedStype] = createSignal(
  config.liveSpeedStyle,
);

ConfigEvent.subscribe(({ key, newValue }) => {
  if (key === "liveSpeedStyle") {
    setLifeSpeedStype(newValue);
  }
});
