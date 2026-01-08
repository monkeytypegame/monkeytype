import { createMemo, createSignal } from "solid-js";
import { qsr } from "../utils/dom";
import { LiveCounter } from "./live-counter";
import { render } from "solid-js/web";
import {
  getLiveAccStyle,
  getLiveBurstStyle,
  getLiveSpeedStyle,
} from "../signals/config";
import { isFocused } from "./focus";

const [getWpm, setLiveStatWpm] = createSignal("0");
const [getAcc, setLiveStatAcc] = createSignal("100%");
const [getBurst, setLiveStatBurst] = createSignal("0");

const [statsVisible, setStatsVisible] = createSignal({
  value: false,
  withAnimation: true,
});

const getStatsVisible = () => {
  return {
    value: statsVisible().value && isFocused(),
    withAnimation: statsVisible().withAnimation,
  };
};

export { setLiveStatWpm, setLiveStatAcc, setLiveStatBurst, setStatsVisible };

export function mountLiveCounters(): void {
  const textWrapper = qsr("#liveStatsTextBottom");
  render(
    () => (
      <>
        <LiveCounter
          class="liveSpeed"
          value={() => (getLiveSpeedStyle() === "text" ? getWpm() : "")}
          visible={getStatsVisible}
        />
        <LiveCounter
          class="liveAcc"
          value={() => (getLiveAccStyle() === "text" ? getAcc() : "")}
          visible={getStatsVisible}
        />
        <LiveCounter
          class="liveBurst"
          value={() => (getLiveBurstStyle() === "text" ? getBurst() : "")}
          visible={getStatsVisible}
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
          visible={getStatsVisible}
        />
        <LiveCounter
          class="acc"
          value={() => (getLiveAccStyle() === "mini" ? getAcc() : "")}
          visible={getStatsVisible}
        />
        <LiveCounter
          class="burst"
          value={() => (getLiveBurstStyle() === "mini" ? getBurst() : "")}
          visible={getStatsVisible}
        />
      </>
    ),
    miniWrapper.native,
  );
}
