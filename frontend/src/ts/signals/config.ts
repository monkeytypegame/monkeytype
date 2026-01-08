import { createSignal } from "solid-js";
import * as ConfigEvent from "../observables/config-event";
import config from "../config";

const [getLiveSpeedStyle, setLiveSpeedStyle] = createSignal(
  config.liveSpeedStyle,
);
const [getLiveAccStyle, setLiveAccStyle] = createSignal(config.liveSpeedStyle);
const [getLiveBurstStyle, setLiveBurstStyle] = createSignal(
  config.liveSpeedStyle,
);

export { getLiveSpeedStyle, getLiveAccStyle, getLiveBurstStyle };

ConfigEvent.subscribe(({ key, newValue }) => {
  if (key === "liveSpeedStyle") {
    setLiveSpeedStyle(newValue);
  } else if (key === "liveAccStyle") {
    setLiveAccStyle(newValue);
  } else if (key === "liveBurstStyle") {
    setLiveBurstStyle(newValue);
  }
});
