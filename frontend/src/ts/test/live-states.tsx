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

const [wpmVisible, setWpmVisible] = createSignal({
  value: false,
  withAnimation: true,
});

export { setLiveStatWpm, setLiveStatAcc, setLiveStatBurst, setWpmVisible };

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
      <div class="wrapper">
        {/* <LiveCounter class="liveSpeed" value={liveWpmText} />
        <LiveCounter class="liveAcc" value={liveAccText} />
        <LiveCounter class="liveBurst" value={liveBurstText} /> */}
      </div>
    ),
    textWrapper.native,
  );

  const miniWrapper = qsr("#liveStatsMini");
  render(
    () => (
      <div>
        <LiveCounter class="speed" value={liveWpmMini} visible={wpmVisible} />
        {/* <LiveCounter class="acc" value={liveAccMini} />
        <LiveCounter class="burst" value={liveBurstMini} /> */}
      </div>
    ),
    miniWrapper.native,
  );
}
