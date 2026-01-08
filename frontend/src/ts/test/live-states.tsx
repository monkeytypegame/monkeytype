import { createMemo } from "solid-js";
import { qsr } from "../utils/dom";
import { LiveCounter } from "./live-counter";
import { render } from "solid-js/web";
import { getWpm } from "../signals/live-states";
import { getLiveSpeedStyle } from "../signals/config";

const liveWpm = createMemo(() => {
  return getLiveSpeedStyle() !== "off" ? getWpm() : "";
});

export function mountLiveCounters(): void {
  render(
    () => <LiveCounter value={liveWpm} />,
    qsr("#liveSpeedCounter").native,
  );
}
