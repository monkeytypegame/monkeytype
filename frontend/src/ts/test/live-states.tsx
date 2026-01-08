import { createSignal } from "solid-js";
import { qsr } from "../utils/dom";
import { LiveCounter } from "./live-counter";
import { render } from "solid-js/web";

export const [getWpm, setWpm] = createSignal(0);
export const [getAcc, setAcc] = createSignal(0);
export const [getBurst, setBurst] = createSignal(0);

export function mountLiveCounters(): void {
  render(() => <LiveCounter value={getWpm} />, qsr("#liveSpeedCounter").native);
}
