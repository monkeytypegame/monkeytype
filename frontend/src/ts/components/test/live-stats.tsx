import { createSignal } from "solid-js";
import { qsr } from "../../utils/dom";
import { LiveCounter } from "../../test/live-counter";
import { render } from "solid-js/web";
import {
  getLiveAccStyle,
  getLiveBurstStyle,
  getLiveSpeedStyle,
} from "../../signals/config";
import { isFocused } from "../../test/focus";
import { VisibilityAnimationOptions } from "../../hooks/useVisibilityAnimation";

const [getWpm, setLiveStatWpm] = createSignal("0");
const [getAcc, setLiveStatAcc] = createSignal("100%");
const [getBurst, setLiveStatBurst] = createSignal("0");

const [statsVisible, setStatsVisible] =
  createSignal<VisibilityAnimationOptions>({
    visible: false,
    animate: true,
  });

const getStatsVisible = (): VisibilityAnimationOptions => {
  return {
    visible: statsVisible().visible && isFocused(),
    animate: statsVisible().animate,
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
          visibilityOptions={getStatsVisible}
        />
        <LiveCounter
          class="liveAcc"
          value={() => (getLiveAccStyle() === "text" ? getAcc() : "")}
          visibilityOptions={getStatsVisible}
        />
        <LiveCounter
          class="liveBurst"
          value={() => (getLiveBurstStyle() === "text" ? getBurst() : "")}
          visibilityOptions={getStatsVisible}
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
          visibilityOptions={getStatsVisible}
        />
        <LiveCounter
          class="acc"
          value={() => (getLiveAccStyle() === "mini" ? getAcc() : "")}
          visibilityOptions={getStatsVisible}
        />
        <LiveCounter
          class="burst"
          value={() => (getLiveBurstStyle() === "mini" ? getBurst() : "")}
          visibilityOptions={getStatsVisible}
        />
      </>
    ),
    miniWrapper.native,
  );
}
