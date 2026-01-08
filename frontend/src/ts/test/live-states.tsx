import { createMemo, createSignal } from "solid-js";
import { qsr } from "../utils/dom";
import { LiveCounter } from "./live-counter";
import { render } from "solid-js/web";
import config from "../config";
import * as ConfigEvent from "../observables/config-event";

export const [getWpm, setWpm] = createSignal("0");
export const [getAcc, setAcc] = createSignal(0);
export const [getBurst, setBurst] = createSignal(0);

const [getLiveSpeedStyle, setLifeSpeedStype] = createSignal(
  config.liveSpeedStyle,
);

const liveWpm = createMemo(() => {
  return getLiveSpeedStyle() !== "off" ? getWpm() : "";
});

export function mountLiveCounters(): void {
  render(
    () => <LiveCounter value={liveWpm} />,
    qsr("#liveSpeedCounter").native,
  );
}

ConfigEvent.subscribe(({ key, newValue }) => {
  if (key === "liveSpeedStyle") {
    setLifeSpeedStype(newValue);
  }
});
