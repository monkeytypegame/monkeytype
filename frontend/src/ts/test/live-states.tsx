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

const liveWpmText = createMemo(() =>
  getLiveSpeedStyle() === "text" ? getWpm() : "",
);
const liveWpmMini = createMemo(() =>
  getLiveSpeedStyle() === "mini" ? getWpm() : "",
);
const liveAccText = createMemo(() =>
  getLiveAccStyle() === "text" ? getAcc() : "",
);
const liveAccMini = createMemo(() =>
  getLiveAccStyle() === "mini" ? getAcc() : "",
);
const liveBurstText = createMemo(() =>
  getLiveBurstStyle() === "text" ? getBurst() : "",
);
const liveBurstMini = createMemo(() =>
  getLiveBurstStyle() === "mini" ? getBurst() : "",
);

export function mountLiveCounters(): void {
  const textWrapper = qsr("#liveStatsTextBottom");
  render(
    () => (
      <>
        <LiveCounter
          class="liveSpeed"
          value={liveWpmText}
          visible={statsVisible}
        />
        <LiveCounter
          class="liveAcc"
          value={liveAccText}
          visible={statsVisible}
        />
        <LiveCounter
          class="liveBurst"
          value={liveBurstText}
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
        <LiveCounter class="speed" value={liveWpmMini} visible={statsVisible} />
        <LiveCounter class="acc" value={liveAccMini} visible={statsVisible} />
        <LiveCounter
          class="burst"
          value={liveBurstMini}
          visible={statsVisible}
        />
      </>
    ),
    miniWrapper.native,
  );
}
