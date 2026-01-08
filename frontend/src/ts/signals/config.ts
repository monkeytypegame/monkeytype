import { createSignal } from "solid-js";
import * as ConfigEvent from "../observables/config-event";
import config from "../config";

export const [getLiveSpeedStyle, setLiveSpeedStyle] = createSignal(
  config.liveSpeedStyle,
);
export const [getLiveAccStyle, setLiveAccStyle] = createSignal(
  config.liveSpeedStyle,
);
export const [getLiveBurstStyle, setLiveBurstStyle] = createSignal(
  config.liveSpeedStyle,
);

ConfigEvent.subscribe(({ key, newValue }) => {
  if (key === "liveSpeedStyle") {
    setLiveSpeedStyle(newValue);
  } else if (key === "liveAccStyle") {
    setLiveAccStyle(newValue);
  } else if (key === "liveBurstStyle") {
    setLiveBurstStyle(newValue);
  }
});
