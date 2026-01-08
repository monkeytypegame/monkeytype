import { createMemo, createSignal } from "solid-js";
import { qsr } from "../utils/dom";
import { LiveCounter } from "./live-counter";
import { render } from "solid-js/web";
import {
  getLiveAccStyle,
  getLiveBurstStyle,
  getLiveSpeedStyle,
} from "../signals/config";

const [getWpm, setLiveStatWpm] = createSignal("0");
const [getAcc, setLiveStatAcc] = createSignal("100%");
const [getBurst, setLiveStatBurst] = createSignal("0");

const [statsVisible, setStatsVisible] = createSignal({
  value: false,
  withAnimation: true,
});

export { setLiveStatWpm, setLiveStatAcc, setLiveStatBurst, setStatsVisible };

export function mountLiveCounters(): void {
  const textWrapper = qsr("#liveStatsTextBottom");
  render(
    () => (
      <>
        <LiveCounter
          class="liveSpeed"
          value={() => (getLiveSpeedStyle() === "text" ? getWpm() : "")}
          visible={statsVisible}
        />
        <LiveCounter
          class="liveAcc"
          value={() => (getLiveAccStyle() === "text" ? getAcc() : "")}
          visible={statsVisible}
        />
        <LiveCounter
          class="liveBurst"
          value={() => (getLiveBurstStyle() === "text" ? getBurst() : "")}
          visible={statsVisible}
        />
      </>
    ),
    textWrapper.native,
  );

  const miniWrapper = qsr("#liveStatsMini");
  render(
    () => (
      <>
        <LiveCounter
          class="speed"
          value={() => (getLiveSpeedStyle() === "mini" ? getWpm() : "")}
          visible={statsVisible}
        />
        <LiveCounter
          class="acc"
          value={() => (getLiveAccStyle() === "mini" ? getAcc() : "")}
          visible={statsVisible}
        />
        <LiveCounter
          class="burst"
          value={() => (getLiveBurstStyle() === "mini" ? getBurst() : "")}
          visible={statsVisible}
        />
      </>
    ),
    miniWrapper.native,
  );
}
